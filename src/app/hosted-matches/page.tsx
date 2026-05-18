import Link from "next/link";
import { listHostedMatchesPublic } from "@/lib/repositories/hostedMatch.repository";

export default async function HostedMatchesPage() {
  const hostedMatches = await listHostedMatchesPublic();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Hosted Matches</h1>
        <Link href="/host/matches/create" className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
          Host Match
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {hostedMatches.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No hosted matches yet.</p>
        ) : (
          hostedMatches.map((match) => (
            <Link key={match.id} href={`/hosted-matches/${match.id}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <p className="text-base font-semibold text-[var(--text-primary)]">{match.title}</p>
              <p className="text-sm text-[var(--text-secondary)]">{match.teamA.name} vs {match.teamB.name}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
