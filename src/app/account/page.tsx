import Link from "next/link";
import AccountLogoutButton from "@/components/account/AccountLogoutButton";
import { requireAuthenticatedPageSession } from "@/services/auth/pageAuth";

const cardClass =
  "block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition hover:border-[var(--accent-brand)]/70 hover:bg-[var(--bg-raised)]";

export default async function AccountDashboardPage() {
  await requireAuthenticatedPageSession("/account");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">My Account</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/account/profile" className={cardClass}>
          <p className="text-base font-semibold text-[var(--text-primary)]">My Profile</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">View and update profile details</p>
        </Link>

        <Link href="/account/settings" className={cardClass}>
          <p className="text-base font-semibold text-[var(--text-primary)]">Settings</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage account preferences</p>
        </Link>

        <div className={cardClass}>
          <p className="text-base font-semibold text-[var(--text-primary)]">Notifications</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Coming soon</p>
        </div>

        <div className={cardClass}>
          <p className="text-base font-semibold text-[var(--text-primary)]">Subscription</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Coming soon</p>
        </div>
      </div>

      <div className="pt-2">
        <AccountLogoutButton />
      </div>
    </div>
  );
}
