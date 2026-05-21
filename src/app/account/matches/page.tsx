import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Hosted Matches — CricSmart" };

type HostedMatchListItem = Prisma.HostedMatchGetPayload<{
  include: {
    teamA: true;
    teamB: true;
  };
}>;

export default async function HostedMatchesPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/matches");

  const matches = await prisma.hostedMatch.findMany({
    where: { createdById: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      teamA: true,
      teamB: true,
    },
  });

  const live = matches.filter((match) => match.status === "LIVE");
  const upcoming = matches.filter((match) => match.status === "DRAFT");
  const completed = matches.filter((match) => match.status === "COMPLETED");

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Account</p>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Hosted Matches</h1>
          </div>
          <Link
            href="/host/matches/create"
            className="rounded-lg bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
          >
            + Host Match
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] py-16 text-center">
            <p className="mb-2 text-sm text-[var(--text-secondary)]">You have not hosted any matches yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <MatchSection title="Live" matches={live} />
            <MatchSection title="Upcoming" matches={upcoming} />
            <MatchSection title="Completed" matches={completed} />
          </div>
        )}
      </div>
    </main>
  );
}

function MatchSection({ title, matches }: { title: string; matches: HostedMatchListItem[] }) {
  if (matches.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">{title}</h2>
      <div className="space-y-3">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/hosted-matches/${match.id}/control`}
            className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition hover:border-[var(--text-muted)]"
          >
            <p className="text-base font-semibold text-[var(--text-primary)]">{match.title}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {match.teamA.name} vs {match.teamB.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}