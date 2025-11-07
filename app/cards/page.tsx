import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function CardsPage() {
  const user = await requireUser();
  const [cards, accounts] = await Promise.all([
    prisma.card.findMany({ where: { account: { userId: user.id } } }),
    prisma.account.findMany({ where: { userId: user.id } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your Cards</h1>
      <form className="flex flex-col gap-2 sm:flex-row" action="/api/cards/remove" method="post"></form>
      <div className="rounded border border-zinc-800 p-4">
        <div className="mb-3 text-sm text-zinc-400">Add Card</div>
        <AddCardForm accounts={accounts} />
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map(c => (
          <li key={c.id} className="rounded border border-zinc-800 p-4">
            <div className="text-sm text-zinc-400">{c.cardNumber.replace(/\d(?=\d{4})/g, "*")}</div>
            <div className="mt-2 text-sm">Expiry: {c.expiry}</div>
            <form action="/api/cards/toggle" method="post" className="mt-3">
              <input type="hidden" name="cardId" value={c.id} />
              <button className="rounded bg-zinc-100 px-3 py-1 text-black">{c.isFrozen ? "Unfreeze" : "Freeze"}</button>
            </form>
            <form action="/api/cards/remove" method="post" className="mt-2">
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
    <form action="/api/cards/create" method="post" className="grid grid-cols-1 gap-2 sm:grid-cols-4">
      <select name="accountId" className="rounded border border-zinc-800 bg-black p-2">
        {accounts.map(a => (
          <option key={a.id} value={a.id}>{a.accountNumber}</option>
        ))}
      </select>
      <input name="cardNumber" className="rounded border border-zinc-800 bg-black p-2" placeholder="Card Number" />
      <input name="expiry" className="rounded border border-zinc-800 bg-black p-2" placeholder="MM/YY" />
      <button className="rounded bg-zinc-100 px-3 py-2 text-black">Add</button>
    </form>
  );
}


