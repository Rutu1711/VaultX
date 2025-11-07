"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full rounded border border-zinc-700 bg-transparent p-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full rounded border border-zinc-700 bg-transparent p-2" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full rounded border border-zinc-700 bg-transparent p-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="w-full rounded bg-zinc-100 p-2 text-black">Create account</button>
      </form>
    </div>
  );
}


