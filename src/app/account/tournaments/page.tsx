import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

export const metadata = { title: "My Tournaments — CricSmart" };

export default async function TournamentsPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/tournaments");

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Account</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">My Tournaments</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Tournament management is in progress and will ship in an upcoming phase.
          </p>
        </div>

        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
          <p className="text-3xl">🏆</p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">Coming soon</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            You&apos;ll soon be able to create tournaments, manage participants, and schedule fixtures here.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/host/matches/create"
              className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Host a match
            </Link>
            <Link
              href="/account"
              className="rounded-lg border border-[var(--accent-brand)]/35 px-3 py-1.5 text-sm text-[var(--accent-brand)] transition hover:border-[var(--accent-brand)]/65"
            >
              Back to account
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
