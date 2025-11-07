"use client";

import { useMemo, useState } from "react";

type Account = {
  id: string;
  accountNumber: string;
  balance: number;
};

type Beneficiary = {
  id: string;
  nickname: string;
  accountNumber: string;
};

type Props = {
  accounts: Account[];
  beneficiaries: Beneficiary[];
  transferStatus?: string;
  beneficiaryStatus?: string;
};

const quickAmounts = [50, 100, 250, 500];

export default function TransferPanel({
  accounts,
  beneficiaries,
  transferStatus,
  beneficiaryStatus,
}: Props) {
  const [senderId, setSenderId] = useState(accounts[0]?.id ?? "");
  const [receiverAccount, setReceiverAccount] = useState("");
  const [amount, setAmount] = useState("");
  const alert = useMemo(() => {
    if (transferStatus === "1") {
      return { tone: "success" as const, text: "Transfer successful ✔" };
    }
    if (beneficiaryStatus === "added") {
      return { tone: "success" as const, text: "Beneficiary added ✅" };
    }
    if (beneficiaryStatus === "deleted") {
      return { tone: "info" as const, text: "Beneficiary deleted" };
    }
    if (beneficiaryStatus === "exists") {
      return { tone: "error" as const, text: "Beneficiary already exists" };
    }
    return null;
  }, [transferStatus, beneficiaryStatus]);

  const senderBalance = useMemo(() => {
    return accounts.find((a) => a.id === senderId)?.balance ?? 0;
  }, [accounts, senderId]);

  return (
    <div className="space-y-6">
      <div className="rounded border border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Transfer Funds</h2>
            <p className="text-sm text-zinc-500">Balance: ${senderBalance.toFixed(2)}</p>
          </div>
        </div>
        <form action="/api/transactions/transfer" method="post" className="mt-4 space-y-3">
          <select
            name="senderId"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            className="w-full rounded border border-zinc-800 bg-black p-2"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountNumber} (${a.balance.toFixed(2)})
              </option>
            ))}
          </select>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <input
              name="receiverAccountNumber"
              value={receiverAccount}
              onChange={(e) => setReceiverAccount(e.target.value)}
              className="w-full rounded border border-zinc-800 bg-black p-2"
              placeholder="Receiver Account Number"
              required
            />
            {beneficiaries.length > 0 && (
              <select
                aria-label="Choose beneficiary"
                className="rounded border border-zinc-800 bg-black p-2"
                onChange={(e) => {
                  const accountNumber = e.target.value;
                  if (!accountNumber) return;
                  setReceiverAccount(accountNumber);
                }}
              >
                <option value="">Beneficiaries</option>
                {beneficiaries.map((b) => (
                  <option key={b.id} value={b.accountNumber}>
                    {b.nickname}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <input
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded border border-zinc-800 bg-black p-2"
              placeholder="Amount"
              type="number"
              step="0.01"
              min="1"
              required
            />
            <div className="mt-2 flex gap-2 text-xs text-zinc-500">
              {quickAmounts.map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setAmount(String(value))}
                  className="rounded border border-zinc-700 px-2 py-1 hover:border-zinc-500"
                >
                  +${value}
                </button>
              ))}
            </div>
          </div>
          <button className="w-full rounded bg-zinc-100 px-4 py-2 text-black">Send transfer</button>
        </form>
        {alert && (
          <div
            className={`mt-4 rounded border px-3 py-2 text-sm ${
              alert.tone === "success"
                ? "border-emerald-500 text-emerald-400"
                : alert.tone === "error"
                ? "border-red-500 text-red-400"
                : "border-zinc-600 text-zinc-300"
            }`}
          >
            {alert.text}
          </div>
        )}
      </div>

      <div className="rounded border border-zinc-800 p-4">
        <h2 className="text-lg font-medium">Beneficiaries</h2>
        <form action="/api/beneficiaries/create" method="post" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input name="nickname" className="rounded border border-zinc-800 bg-black p-2" placeholder="Nickname" required />
          <input name="accountNumber" className="rounded border border-zinc-800 bg-black p-2" placeholder="Account Number" required />
          <button className="rounded bg-zinc-100 px-3 py-2 text-black">Save</button>
        </form>
        {beneficiaries.length > 0 ? (
          <ul className="mt-4 divide-y divide-zinc-800 text-sm">
            {beneficiaries.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{b.nickname}</div>
                  <div className="text-xs text-zinc-500">{b.accountNumber}</div>
                </div>
                <form action="/api/beneficiaries/delete" method="post">
                  <input type="hidden" name="id" value={b.id} />
                  <button className="rounded border border-red-500 px-3 py-1 text-red-400">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No saved beneficiaries yet.</p>
        )}
      </div>
    </div>
  );
}


