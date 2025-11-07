import Link from "next/link";
import { getSessionUser } from "../lib/auth";

export default async function Nav() {
  const user = await getSessionUser();
  return (
    <header className="border-b border-zinc-800 bg-black text-zinc-100">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">VaultX</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/cards">Cards</Link>
          <Link href="/analytics">Analytics</Link>
          <Link href="/settings">Settings</Link>
          {user ? (
            <form action="/api/auth/logout" method="post">
              <button className="rounded bg-zinc-100 px-3 py-1 text-black">Logout</button>
            </form>
          ) : (
            <Link href="/login" className="rounded bg-zinc-100 px-3 py-1 text-black">Login</Link>
          )}
        </div>
      </nav>
    </header>
  );
}


