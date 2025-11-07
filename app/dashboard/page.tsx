import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const [accounts, cards, transactions] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.card.findMany({ where: { account: { userId: user.id } }, orderBy: { createdAt: "desc" } }),
    prisma.transaction.findMany({
      where: {
        OR: [
          { sender: { userId: user.id } },
          { receiver: { userId: user.id } },
        ],
      },
      include: { sender: { select: { accountNumber: true, userId: true } }, receiver: { select: { accountNumber: true, userId: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const incoming30 = transactions
    .filter((t) => t.receiver?.userId === user.id && t.createdAt >= monthAgo)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const outgoing30 = transactions
    .filter((t) => t.sender?.userId === user.id && t.createdAt >= monthAgo)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const status = Array.isArray(searchParams?.created) ? searchParams?.created[0] : searchParams?.created;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Welcome back, {user.name}</h1>
        <p className="text-sm text-zinc-500">Here’s what happened in the last 30 days.</p>
      </div>
      {status === "1" && (
        <div className="rounded border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          New account created. You can start funding it immediately.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Balance" value={`$${totalBalance.toFixed(2)}`} />
        <SummaryCard label="Accounts" value={accounts.length.toString()} />
        <SummaryCard label="Money In (30d)" value={`$${incoming30.toFixed(2)}`} trend="positive" />
        <SummaryCard label="Money Out (30d)" value={`$${outgoing30.toFixed(2)}`} trend="negative" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded border border-zinc-800 p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Accounts</h2>
            <form action="/api/accounts/create" method="post">
              <button className="rounded border border-zinc-700 px-3 py-1 text-sm">New account</button>
            </form>
          </div>
          <ul className="divide-y divide-zinc-800 text-sm">
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{account.accountNumber}</div>
                  <div className="text-xs text-zinc-500">Opened {account.createdAt.toISOString().slice(0, 10)}</div>
                </div>
                <div className="text-right text-base">${Number(account.balance).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <h2 className="text-lg font-medium">Cards</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cards.slice(0, 3).map((card) => (
              <li key={card.id} className="rounded border border-zinc-800/70 p-3">
                <div className="flex items-center justify-between">
                  <span>{card.cardNumber.replace(/\d(?=\d{4})/g, "•")}</span>
                  <span className={`text-xs ${card.isFrozen ? "text-red-400" : "text-emerald-400"}`}>
                    {card.isFrozen ? "Frozen" : "Active"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">Limit: {card.limit ? `$${Number(card.limit).toFixed(2)}` : "Unlimited"}</div>
              </li>
            ))}
            {cards.length === 0 && <li className="text-xs text-zinc-500">No cards yet. Create one from the Cards tab.</li>}
          </ul>
        </div>
      </div>

      <div className="rounded border border-zinc-800">
        <div className="border-b border-zinc-800 p-3 text-sm text-zinc-400">Recent Activity</div>
        <ul className="divide-y divide-zinc-800 text-sm">
          {transactions.map((t) => (
            <li key={t.id} className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-4 sm:items-center">
              <span className="font-medium">{t.status}</span>
              <span className="text-zinc-500">{t.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              <span>{t.sender?.accountNumber ?? "External"} → {t.receiver?.accountNumber ?? "External"}</span>
              <span className={`text-right ${t.receiver?.userId === user.id ? "text-emerald-400" : "text-red-400"}`}>
                {t.receiver?.userId === user.id ? "+" : "-"}${Number(t.amount).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: "positive" | "negative";
}) {
  return (
    <div className="rounded border border-zinc-800 p-4">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {trend === "positive" && <div className="mt-1 text-xs text-emerald-400">Trending up</div>}
      {trend === "negative" && <div className="mt-1 text-xs text-red-400">Watch spend</div>}
    </div>
  );
}


