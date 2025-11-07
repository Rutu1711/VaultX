import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import SpendingChart from "../../components/analytics/SpendingChart";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const [transactions, beneficiaries] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        OR: [
          { sender: { userId: user.id } },
          { receiver: { userId: user.id } },
        ],
      },
      include: {
        sender: { select: { accountNumber: true, userId: true } },
        receiver: { select: { accountNumber: true, userId: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.beneficiary.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);

  const monthBuckets: { [key: string]: { incoming: number; outgoing: number; label: string } } = {};
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthBuckets[key] = {
      incoming: 0,
      outgoing: 0,
      label: d.toLocaleString("default", { month: "short" }),
    };
  }

  const outgoingByReceiver = new Map<string, { amount: number; account: string }>();

  transactions.forEach((txn) => {
    const key = `${txn.createdAt.getFullYear()}-${txn.createdAt.getMonth()}`;
    if (!(key in monthBuckets)) return;
    if (txn.receiver?.userId === user.id) {
      monthBuckets[key].incoming += Number(txn.amount);
    }
    if (txn.sender?.userId === user.id) {
      monthBuckets[key].outgoing += Number(txn.amount);
      const account = txn.receiver?.accountNumber ?? "External";
      const existing = outgoingByReceiver.get(account) ?? { amount: 0, account };
      existing.amount += Number(txn.amount);
      outgoingByReceiver.set(account, existing);
    }
  });

  const chartData = Object.values(monthBuckets).map((bucket) => ({
    month: bucket.label,
    incoming: Number(bucket.incoming.toFixed(2)),
    outgoing: Number(bucket.outgoing.toFixed(2)),
    net: Number((bucket.incoming - bucket.outgoing).toFixed(2)),
  }));

  const topRecipients = Array.from(outgoingByReceiver.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const avgTicket =
    transactions.length > 0
      ? transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-zinc-500">Visualize inflow/outflow and favourite destinations.</p>
      </div>

      <div className="rounded border border-zinc-800 p-4">
        <h2 className="text-lg font-medium">Cashflow (last 6 months)</h2>
        <SpendingChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded border border-zinc-800 p-4">
          <h3 className="text-sm text-zinc-400">Average Ticket</h3>
          <div className="mt-2 text-3xl font-semibold">${avgTicket.toFixed(2)}</div>
          <p className="mt-2 text-xs text-zinc-500">Average amount per transaction across all activity.</p>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <h3 className="text-sm text-zinc-400">Beneficiaries Saved</h3>
          <div className="mt-2 text-3xl font-semibold">{beneficiaries.length}</div>
          <p className="mt-2 text-xs text-zinc-500">Add beneficiaries from the Transfers tab for one-click payments.</p>
        </div>
        <div className="rounded border border-zinc-800 p-4">
          <h3 className="text-sm text-zinc-400">Success Rate</h3>
          <div className="mt-2 text-3xl font-semibold">{calculateSuccessRate(transactions)}%</div>
          <p className="mt-2 text-xs text-zinc-500">Completed transactions divided by attempts.</p>
        </div>
      </div>

      <div className="rounded border border-zinc-800 p-4">
        <h2 className="text-lg font-medium">Top Recipients</h2>
        {topRecipients.length > 0 ? (
          <ul className="mt-4 divide-y divide-zinc-800 text-sm">
            {topRecipients.map((recipient) => (
              <li key={recipient.account} className="flex items-center justify-between py-2">
                <span>{recipient.account}</span>
                <span>${recipient.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Send a transfer to see the leaderboard populate.</p>
        )}
      </div>
    </div>
  );
}

function calculateSuccessRate(transactions: { status: string }[]) {
  if (transactions.length === 0) return 100;
  const success = transactions.filter((t) => t.status === "SUCCESS").length;
  return Math.round((success / transactions.length) * 100);
}


