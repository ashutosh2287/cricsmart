import { requireAuthenticatedPageSession } from "@/services/auth/pageAuth";

export default async function AccountSettingsPage() {
  await requireAuthenticatedPageSession("/account/settings");

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Account settings and preferences will be expanded in upcoming iterations.
      </p>
    </div>
  );
}

