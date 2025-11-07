import Link from "next/link";

export default function Home() {
  return (
    <section className="py-24">
      <h1 className="text-4xl font-semibold">VaultX — Next‑Gen Online Banking</h1>
      <p className="mt-4 max-w-2xl text-zinc-400">
        A modern, secure, dark‑themed banking experience. Sign up to get started.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/register" className="rounded bg-zinc-100 px-4 py-2 text-black">Get Started</Link>
        <Link href="/login" className="rounded border border-zinc-700 px-4 py-2">Login</Link>
      </div>
    </section>
  );
}
