import Link from "next/link";
import { listHostedMatchesByCreator } from "@/lib/repositories/hostedMatch.repository";
import { requireAuthenticatedPageSession } from "@/services/auth/pageAuth";

export default async function AccountHostedMatchesPage() {
  const session = await requireAuthenticatedPageSession("/account/hosted-matches");
  const hostedMatches = await listHostedMatchesByCreator(session.userId);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Hosted Matches</h1>
        <Link href="/host/matches/create" className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
          Host Match
        </Link>
      </div>

      {hostedMatches.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">You have not hosted any matches yet.</p>
      ) : (
        <div className="space-y-3">
          {hostedMatches.map((match) => (
            <Link key={match.id} href={`/hosted-matches/${match.id}/control`} className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <p className="text-base font-semibold text-[var(--text-primary)]">{match.title}</p>
              <p className="text-sm text-[var(--text-secondary)]">{match.teamA.name} vs {match.teamB.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
