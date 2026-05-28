import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { prisma } from "@/lib/db/prisma";

export const metadata = { title: "Hosted Matches — CricSmart" };

type MatchCardMatch = {
  id: string;
  title: string | null;
  status: string;
  createdAt: Date;
  runtimeMatchId: string | null;
  tossDecision: "BAT" | "BOWL" | null;
  teamA: { id: string; name: string } | null;
  teamB: { id: string; name: string } | null;
  tossWinner: { id: string; name: string } | null;
};

export default async function HostedMatchesPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/matches");

  const matches = (await prisma.hostedMatch.findMany({
    where: { createdById: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
      tossWinner: { select: { id: true, name: true } },
    },
  })) as MatchCardMatch[];

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
            className="rounded-lg bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-[#ffffff] transition hover:opacity-95"
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

function MatchSection({ title, matches }: { title: string; matches: MatchCardMatch[] }) {
  if (matches.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">{title}</h2>
      <div className="space-y-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({ match }: { match: MatchCardMatch }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 transition hover:border-[var(--text-muted)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{match.title ?? "Untitled Match"}</p>
            <span
              className={`shrink-0 rounded border px-2 py-0.5 text-xs ${
                match.status === "LIVE"
                  ? "border-red-500/30 text-red-400"
                  : match.status === "COMPLETED"
                    ? "border-[var(--border)] text-[var(--text-3)]"
                    : "border-blue-500/30 text-blue-400"
              }`}
            >
              {match.status}
            </span>
          </div>

          <p className="mb-1 text-xs text-[var(--text-secondary)]">
            {match.teamA?.name ?? "TBA"} vs {match.teamB?.name ?? "TBA"}
          </p>

          {match.tossWinner ? (
            <p className="text-xs text-[var(--text-muted)]">
              🪙 {match.tossWinner.name} won toss · elected to {match.tossDecision === "BAT" ? "bat" : "bowl"}
            </p>
          ) : null}

          <p className="mt-1 text-xs text-[var(--text-muted)]/80">{new Date(match.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          {match.runtimeMatchId ? (
            <Link
              href={`/match/${match.runtimeMatchId}`}
              className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-center text-xs text-emerald-400 transition hover:border-emerald-500"
            >
              Match Center →
            </Link>
          ) : null}
          <Link
            href={`/hosted-matches/${match.id}`}
            className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-center text-xs text-[var(--text-secondary)] transition hover:border-[var(--text-muted)]"
          >
            Control
          </Link>
        </div>
      </div>
    </div>
  );
}
