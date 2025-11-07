import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export default async function AdminPage() {
  await requireUser();
  const [usersCount, accountsCount, transactionsCount, latestUsers, latestTxs] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin (Overview)</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded border border-zinc-800 p-4"><div className="text-sm text-zinc-400">Users</div><div className="text-2xl font-semibold">{usersCount}</div></div>
        <div className="rounded border border-zinc-800 p-4"><div className="text-sm text-zinc-400">Accounts</div><div className="text-2xl font-semibold">{accountsCount}</div></div>
        <div className="rounded border border-zinc-800 p-4"><div className="text-sm text-zinc-400">Transactions</div><div className="text-2xl font-semibold">{transactionsCount}</div></div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded border border-zinc-800">
          <div className="border-b border-zinc-800 p-3 text-sm text-zinc-400">Latest Users</div>
          <ul className="divide-y divide-zinc-800 text-sm">
            {latestUsers.map(u => (
              <li key={u.id} className="flex items-center justify-between p-3">
                <span>{u.name}</span>
                <span className="text-zinc-500">{u.email}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-zinc-800">
          <div className="border-b border-zinc-800 p-3 text-sm text-zinc-400">Latest Transactions</div>
          <ul className="divide-y divide-zinc-800 text-sm">
            {latestTxs.map(t => (
              <li key={t.id} className="flex items-center justify-between p-3">
                <span>{t.status}</span>
                <span>${Number(t.amount).toFixed(2)}</span>
                <span className="text-zinc-500">{t.createdAt.toISOString().slice(0,10)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


