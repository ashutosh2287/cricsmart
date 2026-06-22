import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

export const metadata = { title: "Saved & Favourites — CricSmart" };

export default async function SavedPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/saved");

  const [savedMatches, favoriteTeams] = await Promise.all([
    prisma.savedMatch.findMany({
      where: { userId: session.userId },
      include: {
        hostedMatch: {
          include: {
            teamA: true,
            teamB: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favoriteTeam.findMany({
      where: { userId: session.userId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Account</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Saved & Favourites</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your bookmarked matches and favourite teams.
          </p>
        </div>

        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Saved Matches</h2>
          </div>
          <div className="space-y-2">
            {savedMatches.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl">📌</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">No saved matches yet.</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Bookmark matches from the matches page to find them here.
                </p>
              </div>
            ) : (
              savedMatches.map((saved) => {
                const match = saved.hostedMatch;
                return (
                  <Link
                    key={saved.id}
                    href={`/hosted-matches/${match.slug ?? match.id}`}
                    className="block rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-4 py-3 transition hover:border-[var(--text-muted)]"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{match.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {match.teamA.name} vs {match.teamB.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {match.status} · Saved {new Date(saved.createdAt).toLocaleDateString()}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Favourite Teams</h2>
          <div className="space-y-2">
            {favoriteTeams.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl">⭐</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">No favourite teams yet.</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Favourite a team from their profile to see it here.
                </p>
              </div>
            ) : (
              favoriteTeams.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/teams/${fav.team.slug}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-4 py-3 transition hover:border-[var(--text-muted)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{fav.team.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {fav.team._count.members} member{fav.team._count.members === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">Open →</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
