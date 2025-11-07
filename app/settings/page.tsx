import { requireUser } from "../../lib/auth";

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function SettingsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const status = Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="rounded border border-zinc-800 p-4 text-sm text-zinc-400">Logged in as {user.email}</div>
      {status && <StatusBanner status={status} />}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <form action="/api/user/update" method="post" className="space-y-3">
          <div className="text-sm text-zinc-400">Profile</div>
          <input name="name" defaultValue={user.name} className="w-full rounded border border-zinc-800 bg-black p-2" />
          <input name="email" defaultValue={user.email} type="email" className="w-full rounded border border-zinc-800 bg-black p-2" />
          <button className="rounded bg-zinc-100 px-3 py-2 text-black">Save</button>
        </form>
        <form action="/api/user/change-password" method="post" className="space-y-3">
          <div className="text-sm text-zinc-400">Change Password</div>
          <input name="currentPassword" type="password" placeholder="Current password" className="w-full rounded border border-zinc-800 bg-black p-2" required />
          <input name="newPassword" type="password" placeholder="New password" className="w-full rounded border border-zinc-800 bg-black p-2" required />
          <button className="rounded bg-zinc-100 px-3 py-2 text-black">Update</button>
        </form>
      </div>
    </div>
  );
}

function StatusBanner({ status }: { status: string }) {
  const map: Record<string, { tone: string; message: string }> = {
    profile: { tone: "success", message: "Profile updated" },
    password: { tone: "success", message: "Password changed" },
    "bad-password": { tone: "error", message: "Current password is incorrect" },
  };
  const { tone, message } = map[status] ?? { tone: "info", message: "Settings updated" };
  const classes =
    tone === "success"
      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
      : tone === "error"
      ? "border-red-500 bg-red-500/10 text-red-400"
      : "border-zinc-700 bg-zinc-800/40 text-zinc-300";
  return <div className={`rounded border px-4 py-2 text-sm ${classes}`}>{message}</div>;
}


