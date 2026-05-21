import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

export const metadata = { title: "Saved & Favourites — CricSmart" };

export default async function SavedPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/saved");

  const [recentMatches, memberTeams] = await Promise.all([
    prisma.hostedMatch.findMany({
      where: {
        createdById: session.userId,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        teamA: { select: { name: true } },
        teamB: { select: { name: true } },
      },
    }),
    prisma.team.findMany({
      where: {
        members: { some: { userId: session.userId } },
      },
      include: {
        _count: { select: { members: true } },
      },
      take: 6,
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
            Placeholder collections from your recent completed matches and teams you are part of.
          </p>
        </div>

        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Recent Matches</h2>
            <Link href="/account/hosted-matches" className="text-xs font-semibold text-[var(--accent-brand)] hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentMatches.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No completed hosted matches yet.</p>
            ) : (
              recentMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/hosted-matches/${match.id}/control`}
                  className="block rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-4 py-3 transition hover:border-[var(--text-muted)]"
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{match.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {match.teamA.name} vs {match.teamB.name}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Favourite Teams</h2>
          <div className="space-y-2">
            {memberTeams.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No team memberships found yet.</p>
            ) : (
              memberTeams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.slug}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-4 py-3 transition hover:border-[var(--text-muted)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{team.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      {team._count.members} member{team._count.members === 1 ? "" : "s"}
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
