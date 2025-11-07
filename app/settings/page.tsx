import { requireUser } from "../../lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="rounded border border-zinc-800 p-4 text-sm text-zinc-400">Logged in as {user.email}</div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <form action="/api/user/update" method="post" className="space-y-3">
          <div className="text-sm text-zinc-400">Profile</div>
          <input name="name" defaultValue={user.name} className="w-full rounded border border-zinc-800 bg-black p-2" />
          <input name="email" defaultValue={user.email} type="email" className="w-full rounded border border-zinc-800 bg-black p-2" />
          <button className="rounded bg-zinc-100 px-3 py-2 text-black">Save</button>
        </form>
        <form action="/api/user/change-password" method="post" className="space-y-3">
          <div className="text-sm text-zinc-400">Change Password</div>
          <input name="currentPassword" type="password" placeholder="Current password" className="w-full rounded border border-zinc-800 bg-black p-2" />
          <input name="newPassword" type="password" placeholder="New password" className="w-full rounded border border-zinc-800 bg-black p-2" />
          <button className="rounded bg-zinc-100 px-3 py-2 text-black">Update</button>
        </form>
      </div>
    </div>
  );
}


