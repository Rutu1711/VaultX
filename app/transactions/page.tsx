import { requireUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import TransferPanel from "../../components/transactions/TransferPanel";

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function TransactionsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const [accounts, recent, beneficiaries] = await Promise.all([
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
    prisma.beneficiary.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const transferStatus = Array.isArray(searchParams?.success)
    ? searchParams?.success[0]
    : searchParams?.success;
  const beneficiaryStatus = Array.isArray(searchParams?.beneficiary)
    ? searchParams?.beneficiary[0]
    : searchParams?.beneficiary;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transfers & Beneficiaries</h1>
      <TransferPanel
        accounts={accounts.map((a) => ({ id: a.id, accountNumber: a.accountNumber, balance: Number(a.balance) }))}
        beneficiaries={beneficiaries.map((b) => ({ id: b.id, nickname: b.nickname, accountNumber: b.accountNumber }))}
        transferStatus={transferStatus}
        beneficiaryStatus={beneficiaryStatus}
      />
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


