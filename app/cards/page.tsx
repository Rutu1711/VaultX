import { format } from "date-fns";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

type CardWithAccount = Awaited<ReturnType<typeof getCardsForUser>>[number];
type CardWithStats = CardWithAccount & { monthlySpend: number; limitNumber: number | null };
type CardTransaction = {
  id: string;
  amount: number;
  createdAt: Date;
  merchant: string | null;
  narrative: string | null;
  cardId: string | null;
  cardNumber: string;
  status: string;
};

export default async function CardsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const [cards, accounts, cardTransactions, monthlySpendByCard] = await Promise.all([
    getCardsForUser(user.id),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    getCardTransactions(user.id),
    getMonthlySpend(user.id),
  ]);

  const monthlySpendMap = new Map(monthlySpendByCard.map((item) => [item.cardId, Number(item.total)]));
  const cardsWithStats: CardWithStats[] = cards.map((card) => ({
    ...card,
    monthlySpend: monthlySpendMap.get(card.id) ?? 0,
    limitNumber: card.limit ? Number(card.limit) : null,
  }));

  const statusParam = Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status;
  const statusMessage = getStatusMessage(statusParam);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-zinc-50">Virtual Cards</h1>
        <p className="text-sm text-zinc-500">
          Spin up instant virtual cards for safer online spend. Track usage, download statements, and simulate swipes.
        </p>
      </header>

      {statusMessage && (
        <Alert variant={statusMessage.variant}>
          <div className="space-y-1">
            <AlertTitle>{statusMessage.title}</AlertTitle>
            <AlertDescription>{statusMessage.description}</AlertDescription>
        </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create instant card</CardTitle>
          <CardDescription>Link to any VaultX account and define optional spending limit per month.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddCardForm accounts={accounts.map((account) => ({ id: account.id, accountNumber: account.accountNumber }))} />
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {cardsWithStats.length === 0 && (
          <Card className="border-dashed border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-300">No cards yet</CardTitle>
              <CardDescription>Create your first virtual card above to start simulating purchases.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {cardsWithStats.map((card) => (
          <Card key={card.id} className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-zinc-100">{maskCard(card.cardNumber)}</CardTitle>
                  <CardDescription>
                    Linked to <span className="font-mono text-zinc-300">{card.account.accountNumber}</span>
                  </CardDescription>
                </div>
                <Badge variant={card.isFrozen ? "destructive" : "success"}>{card.isFrozen ? "Frozen" : "Active"}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-zinc-400">
                <InfoRow label="Expiry" value={card.expiry} />
                <InfoRow label="Nickname" value={card.nickname ?? "—"} />
                <InfoRow label="Limit" value={card.limitNumber !== null ? formatCurrency(card.limitNumber) : "Unlimited"} />
                <InfoRow label="Last used" value={card.lastUsedAt ? format(card.lastUsedAt, "dd MMM yyyy HH:mm") : "—"} />
      </div>
            </CardHeader>
            {card.limitNumber !== null && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>This month</span>
                    <span>
                      {formatCurrency(card.monthlySpend)} / {formatCurrency(card.limitNumber)}
                    </span>
            </div>
                <Progress value={card.limitNumber > 0 ? Math.min(100, (card.monthlySpend / card.limitNumber) * 100) : 0} />
            </div>
              </CardContent>
            )}
            <CardContent className="flex flex-col gap-4 pt-4">
              <SpendForm cardId={card.id} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ToggleForm isFrozen={card.isFrozen} cardId={card.id} />
                <UpdateControlsForm
                  cardId={card.id}
                  nickname={card.nickname ?? ""}
                  limit={card.limitNumber !== null ? card.limitNumber.toString() : ""}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t border-zinc-900">
              <form action="/api/cards/remove" method="post">
                <input type="hidden" name="cardId" value={card.id} />
                <Button variant="destructive" size="sm">
                  Remove card
                </Button>
            </form>
            </CardFooter>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent card activity</CardTitle>
          <CardDescription>Latest simulated swipes across all your cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityTable transactions={cardTransactions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Statements & downloads</CardTitle>
          <CardDescription>Generate detailed statements per card for any month.</CardDescription>
        </CardHeader>
        <CardContent>
          <StatementDownload cards={cardsWithStats} />
        </CardContent>
      </Card>
    </div>
  );
}

async function getCardsForUser(userId: string) {
  return prisma.card.findMany({
    where: { account: { userId } },
    include: { account: true },
    orderBy: [{ lastUsedAt: "desc" }, { cardNumber: "asc" }],
  });
}

async function getCardTransactions(userId: string): Promise<CardTransaction[]> {
  const items = await prisma.transaction.findMany({
    where: {
      type: "CARD_SPEND",
      card: { account: { userId } },
    },
    include: {
      card: {
        select: {
          id: true,
          cardNumber: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return items.map((txn) => ({
    id: txn.id,
    amount: Number(txn.amount),
    createdAt: txn.createdAt,
    merchant: txn.merchant,
    narrative: txn.narrative,
    cardId: txn.card?.id ?? null,
    cardNumber: txn.card?.cardNumber ?? "—",
    status: txn.status,
  }));
}

async function getMonthlySpend(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = await prisma.transaction.findMany({
    where: {
      type: "CARD_SPEND",
      card: { account: { userId } },
      createdAt: { gte: startOfMonth },
    },
    select: { cardId: true, amount: true },
  });

  const totals = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.cardId) return;
    totals.set(row.cardId, (totals.get(row.cardId) ?? 0) + Number(row.amount));
  });

  return Array.from(totals.entries()).map(([cardId, total]) => ({ cardId, total }));
}

function getStatusMessage(status?: string | null) {
  switch (status) {
    case "created":
      return { variant: "success" as const, title: "Card created", description: "Your virtual card is ready for simulated spend." };
    case "updated":
      return { variant: "info" as const, title: "Card updated", description: "Controls saved successfully." };
    case "deleted":
      return { variant: "info" as const, title: "Card removed", description: "We removed that card and its controls." };
    case "invalid":
      return { variant: "destructive" as const, title: "Invalid details", description: "Check the form values and try again." };
    case "limit":
      return { variant: "destructive" as const, title: "Limit reached", description: "This purchase exceeds the defined limit for the card." };
    case "insufficient":
      return { variant: "destructive" as const, title: "Insufficient funds", description: "Top up the linked account to complete this spend." };
    case "frozen":
      return { variant: "destructive" as const, title: "Card frozen", description: "Unfreeze the card before attempting another swipe." };
    case "spent":
      return { variant: "success" as const, title: "Spend simulated", description: "We logged the swipe and debited the linked account." };
    default:
      return null;
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function AddCardForm({ accounts }: { accounts: { id: string; accountNumber: string }[] }) {
  return (
    <form action="/api/cards/create" method="post" className="grid grid-cols-1 gap-4 md:grid-cols-6">
      <div className="md:col-span-2">
        <Label htmlFor="accountId">Charge from</Label>
        <Select id="accountId" name="accountId" className="mt-1">
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountNumber}
            </option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="cardNumber">Card number</Label>
        <Input id="cardNumber" name="cardNumber" placeholder="16-digit PAN" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="expiry">Expiry</Label>
        <Input id="expiry" name="expiry" placeholder="MM/YY" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="nickname">Nickname</Label>
        <Input id="nickname" name="nickname" placeholder="Shopping" className="mt-1" />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="limit">Monthly limit (optional)</Label>
        <Input id="limit" name="limit" type="number" step="0.01" placeholder="500" className="mt-1" />
      </div>
      <div className="md:col-span-4 flex items-end">
        <Button type="submit" className="w-full md:w-auto">
          Create card
        </Button>
      </div>
    </form>
  );
}

function SpendForm({ cardId }: { cardId: string }) {
  return (
    <form action="/api/cards/spend" method="post" className="space-y-3 rounded-lg border border-zinc-800/60 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Simulate spend</h3>
          <p className="text-xs text-zinc-500">Debit the linked account and log a merchant swipe.</p>
        </div>
      </div>
      <input type="hidden" name="cardId" value={cardId} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor={`amount-${cardId}`}>Amount</Label>
          <Input id={`amount-${cardId}`} name="amount" type="number" step="0.01" placeholder="49.50" required className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={`merchant-${cardId}`}>Merchant</Label>
          <Input id={`merchant-${cardId}`} name="merchant" placeholder="Acme Digital" required className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor={`narrative-${cardId}`}>Narrative (optional)</Label>
        <Textarea id={`narrative-${cardId}`} name="narrative" placeholder="Device purchase" className="mt-1" rows={3} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="success">
          Log spend
        </Button>
      </div>
    </form>
  );
}

function ToggleForm({ isFrozen, cardId }: { isFrozen: boolean; cardId: string }) {
  return (
    <form action="/api/cards/toggle" method="post" className="rounded-lg border border-zinc-800/60 bg-zinc-950/80 p-4">
      <input type="hidden" name="cardId" value={cardId} />
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Freeze controls</h3>
          <p className="text-xs text-zinc-500">{isFrozen ? "Unfreeze to allow new transaction attempts." : "Freeze instantly to block new swipes."}</p>
        </div>
        <Button variant={isFrozen ? "success" : "outline"} type="submit">
          {isFrozen ? "Unfreeze" : "Freeze"}
        </Button>
      </div>
    </form>
  );
}

function UpdateControlsForm({ cardId, nickname, limit }: { cardId: string; nickname: string; limit: string }) {
  return (
    <form action="/api/cards/set-limit" method="post" className="flex flex-col gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/80 p-4">
      <input type="hidden" name="cardId" value={cardId} />
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">Nickname & limit</h3>
        <p className="text-xs text-zinc-500">Label the card and adjust the monthly ceiling.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor={`nickname-${cardId}`}>Nickname</Label>
          <Input id={`nickname-${cardId}`} name="nickname" defaultValue={nickname} placeholder="Subscriptions" className="mt-1" />
        </div>
        <div>
          <Label htmlFor={`limit-${cardId}`}>Monthly limit</Label>
          <Input id={`limit-${cardId}`} name="limit" type="number" step="0.01" defaultValue={limit} placeholder="Unlimited" className="mt-1" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="outline">
          Save controls
        </Button>
      </div>
    </form>
  );
}

function ActivityTable({ transactions }: { transactions: CardTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-zinc-500">No card activity yet. Log your first spend above.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Card</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Narrative</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell className="text-xs text-zinc-400">{format(txn.createdAt, "dd MMM yyyy • HH:mm")}</TableCell>
              <TableCell className="font-mono text-sm text-zinc-200">{maskCard(txn.cardNumber)}</TableCell>
              <TableCell className="text-sm text-zinc-200">{txn.merchant ?? "—"}</TableCell>
              <TableCell className="text-sm text-zinc-400">{txn.narrative ?? "—"}</TableCell>
              <TableCell className="text-right text-sm font-semibold text-emerald-400">-{formatCurrency(txn.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableCaption>Showing last 20 simulated card spends.</TableCaption>
      </Table>
    </div>
  );
}

function StatementDownload({ cards }: { cards: CardWithStats[] }) {
  if (cards.length === 0) {
    return <p className="text-sm text-zinc-500">Create a card to unlock statement downloads.</p>;
  }

  const months = getRecentMonths();

  return (
    <form action="/api/cards/statements" method="post" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_2fr_auto_auto]">
        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="statement-card">Card</Label>
          <Select id="statement-card" name="cardId" defaultValue={cards[0].id}>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {maskCard(card.cardNumber)} — {card.account.accountNumber}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="statement-month">Month</Label>
          <Select id="statement-month" name="month" defaultValue={months[0].key}>
            {months.map((month) => (
              <option key={month.key} value={month.key}>
                {month.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" name="format" value="pdf">
            Download PDF
          </Button>
          <Button type="submit" variant="outline" name="format" value="csv">
            Download CSV
          </Button>
        </div>
      </div>
      <p className="text-xs text-zinc-500">Statements include monthly totals, individual swipes, and limit utilisation.</p>
    </form>
  );
}

function getRecentMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
    return {
      key,
      label: format(date, "MMMM yyyy"),
    };
  });
}

function formatCurrency(value: number | string | null | undefined) {
  const parsed = typeof value === "string" ? Number(value) : value ?? 0;
  return parsed.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function maskCard(cardNumber: string) {
  return cardNumber.replace(/\d(?=\d{4})/g, "•");
}

