import { requireAuthenticatedPageSession } from "@/services/auth/pageAuth";

export default async function AccountActivityPage() {
  await requireAuthenticatedPageSession("/account/activity");

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Activity Feed</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Activity feed foundation is enabled. Event enrichment and timeline ranking will be expanded in upcoming phases.
      </p>
    </div>
  );
}
