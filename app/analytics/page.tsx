import { requireUser } from "../../lib/auth";

export default async function AnalyticsPage() {
  await requireUser();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="mt-2 text-zinc-400">Charts coming soon. (Placeholder)</p>
      <div className="mt-6 h-48 w-full rounded border border-zinc-800" />
    </div>
  );
}


