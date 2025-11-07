import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    include: { outgoingTransactions: true, incomingTransactions: true },
  });
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const recent = await prisma.transaction.findMany({
    where: {
      OR: [
        { sender: { userId: user.id } },
        { receiver: { userId: user.id } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Total Balance</div>
          <div className="mt-2 text-2xl font-semibold">${totalBalance.toFixed(2)}</div>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Accounts</div>
          <div className="mt-2 text-2xl font-semibold">{accounts.length}</div>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <div className="text-sm text-zinc-400">Recent Txns</div>
          <div className="mt-2 text-2xl font-semibold">{recent.length}</div>
        </div>
      </div>
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


