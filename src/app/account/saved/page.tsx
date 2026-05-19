import Link from "next/link";
import { listFavoriteTeams, listSavedMatches } from "@/lib/repositories/community.repository";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

export default async function AccountSavedPage() {
  const session = await getRequiredRequestAuthSession();
  const [favoriteTeams, savedMatches] = await Promise.all([
    listFavoriteTeams(session.userId),
    listSavedMatches(session.userId),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Favorite Teams</h1>
        <div className="mt-3 space-y-2">
          {favoriteTeams.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No favorite teams yet.</p>
          ) : (
            favoriteTeams.map((favorite) => (
              <Link key={favorite.id} href={`/teams/${favorite.teamId}`} className="block text-sm text-[var(--text-primary)]">
                {favorite.team.name}
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Saved Matches</h2>
        <div className="mt-3 space-y-2">
          {savedMatches.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No saved hosted matches yet.</p>
          ) : (
            savedMatches.map((saved) => (
              <Link key={saved.id} href={`/hosted-matches/${saved.hostedMatchId}`} className="block text-sm text-[var(--text-primary)]">
                {saved.hostedMatch.title}
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
