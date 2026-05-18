import Link from "next/link";
import { notFound } from "next/navigation";
import { getTournamentById } from "@/lib/repositories/tournament.repository";

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament || tournament.visibility !== "PUBLIC") {
    notFound();
  }

  const teamCount = tournament.teams.length;
  const fixtureCount = tournament.matches.length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{tournament.name}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {tournament.format ?? "Format TBD"} {tournament.location ? `· ${tournament.location}` : ""}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Teams</p>
          <p className="text-xl font-semibold text-[var(--text-primary)]">{teamCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Fixtures</p>
          <p className="text-xl font-semibold text-[var(--text-primary)]">{fixtureCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <p className="text-xs text-[var(--text-secondary)]">Visibility</p>
          <p className="text-xl font-semibold text-[var(--text-primary)]">{tournament.visibility}</p>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Fixtures</h2>
        {tournament.matches.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">No fixtures added yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {tournament.matches.map((fixture) => (
              <Link key={fixture.id} href={`/hosted-matches/${fixture.hostedMatchId}`} className="block text-sm text-[var(--text-primary)]">
                {fixture.hostedMatch.title}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Points Table</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Placeholder for lightweight points table foundation.</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Leaderboard</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Placeholder for top performers leaderboard foundation.</p>
        </div>
      </section>
    </div>
  );
}
