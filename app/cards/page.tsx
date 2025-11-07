import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function CardsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const [cards, accounts] = await Promise.all([
    prisma.card.findMany({
      where: { account: { userId: user.id } },
      include: { account: true },
      orderBy: [{ lastUsedAt: "desc" }, { cardNumber: "asc" }],
    }),
    prisma.account.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);
  const status = Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status;
  const statusMessage =
    status === "created"
      ? { tone: "success", text: "New card created" }
      : status === "updated"
      ? { tone: "info", text: "Card updated" }
      : status === "deleted"
      ? { tone: "info", text: "Card removed" }
      : status === "invalid"
      ? { tone: "error", text: "Check the card number (8-19 digits) and try again." }
      : null;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Virtual Cards</h1>
          <p className="text-sm text-zinc-500">Create, freeze, and control spending limits.</p>
        </div>
      </div>
      {statusMessage && (
        <div
          className={`rounded border px-4 py-2 text-sm ${
            statusMessage.tone === "success"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : statusMessage.tone === "error"
              ? "border-red-500 bg-red-500/10 text-red-400"
              : "border-zinc-700 bg-zinc-800/40 text-zinc-300"
          }`}
        >
          {statusMessage.text}
        </div>
      )}
      <div className="rounded border border-zinc-800 p-4">
        <div className="mb-3 text-sm text-zinc-400">Create Instant Card</div>
        <AddCardForm accounts={accounts.map(a => ({ id: a.id, accountNumber: a.accountNumber }))} />
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map(c => (
          <li key={c.id} className="space-y-3 rounded border border-zinc-800 p-4">
            <div>
              <div className="text-sm text-zinc-400">{maskCard(c.cardNumber)}</div>
              <div className="mt-1 text-xs text-zinc-500">Linked to {c.account.accountNumber}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
              <div>Expiry</div>
              <div className="text-right">{c.expiry}</div>
              <div>Status</div>
              <div className={`text-right ${c.isFrozen ? "text-red-400" : "text-emerald-400"}`}>{c.isFrozen ? "Frozen" : "Active"}</div>
              <div>Nickname</div>
              <div className="text-right">{c.nickname ?? "—"}</div>
              <div>Limit</div>
              <div className="text-right">{c.limit ? `$${Number(c.limit).toFixed(2)}` : "Unlimited"}</div>
            </div>
            <form action="/api/cards/toggle" method="post" className="flex gap-2">
              <input type="hidden" name="cardId" value={c.id} />
              <button className="flex-1 rounded bg-zinc-100 px-3 py-2 text-black">
                {c.isFrozen ? "Unfreeze" : "Freeze"}
              </button>
            </form>
            <form action="/api/cards/set-limit" method="post" className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
              <input type="hidden" name="cardId" value={c.id} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input name="nickname" defaultValue={c.nickname ?? ""} className="rounded border border-zinc-800 bg-black p-2" placeholder="Nickname" />
                <input name="limit" defaultValue={c.limit ? Number(c.limit).toString() : ""} className="rounded border border-zinc-800 bg-black p-2" placeholder="Limit (optional)" />
              </div>
              <button className="rounded border border-zinc-600 px-3 py-2 text-sm">Save controls</button>
            </form>
            <form action="/api/cards/remove" method="post" className="text-right">
              <input type="hidden" name="cardId" value={c.id} />
              <button className="rounded border border-red-500 px-3 py-1 text-red-400">Remove</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddCardForm({ accounts }: { accounts: { id: string; accountNumber: string }[] }) {
  return (
    <form action="/api/cards/create" method="post" className="grid grid-cols-1 gap-2 sm:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
      <select name="accountId" className="rounded border border-zinc-800 bg-black p-2">
        {accounts.map(a => (
          <option key={a.id} value={a.id}>{a.accountNumber}</option>
        ))}
      </select>
      <input name="cardNumber" className="rounded border border-zinc-800 bg-black p-2" placeholder="Card Number" required />
      <input name="expiry" className="rounded border border-zinc-800 bg-black p-2" placeholder="MM/YY" required />
      <input name="nickname" className="rounded border border-zinc-800 bg-black p-2" placeholder="Nickname (optional)" />
      <input name="limit" className="rounded border border-zinc-800 bg-black p-2" placeholder="Limit (optional)" />
      <button className="rounded bg-zinc-100 px-3 py-2 text-black">Add</button>
    </form>
  );
}

function maskCard(cardNumber: string) {
  return cardNumber.replace(/\d(?=\d{4})/g, "•");
}


