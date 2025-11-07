import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function TransactionsPage() {
  const user = await requireUser();
  const [accounts, recent] = await Promise.all([
    prisma.account.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({
      where: {
        OR: [
          { sender: { userId: user.id } },
          { receiver: { userId: user.id } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transfer Funds</h1>
      <form action="/api/transactions/transfer" method="post" className="space-y-3">
        <select name="senderId" className="w-full rounded border border-zinc-800 bg-black p-2">
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.accountNumber} (${Number(a.balance).toFixed(2)})</option>
          ))}
        </select>
        <input name="receiverAccountNumber" className="w-full rounded border border-zinc-800 bg-black p-2" placeholder="Receiver Account Number" />
        <input name="amount" className="w-full rounded border border-zinc-800 bg-black p-2" placeholder="Amount" type="number" step="0.01" />
        <button className="rounded bg-zinc-100 px-4 py-2 text-black">Send</button>
      </form>
      <div className="rounded border border-zinc-800">
        <div className="border-b border-zinc-800 p-3 text-sm text-zinc-400">Recent Transactions</div>
        <ul className="divide-y divide-zinc-800">
          {recent.map(t => (
            <li key={t.id} className="flex items-center justify-between p-3 text-sm">
              <span>{t.status}</span>
              <span>${Number(t.amount).toFixed(2)}</span>
              <span className="text-zinc-500">{t.createdAt.toISOString().slice(0,10)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


