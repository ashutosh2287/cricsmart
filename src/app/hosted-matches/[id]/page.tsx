import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

export const dynamic = "force-dynamic";

export default async function HostedMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getRequestAuthSession();

  const match = await prisma.hostedMatch.findUnique({
    where: { id },
    include: {
      teamA: true,
      teamB: true,
      members: true,
    },
  });

  if (!match) notFound();

  const isOwner = session?.userId === match.createdById;
  const isScorerOrOperator = match.members.some((member) => member.userId === session?.userId);
  const hasControlAccess = Boolean(isOwner || isScorerOrOperator);

  if (!hasControlAccess && match.runtimeMatchId) {
    redirect(`/match/${match.runtimeMatchId}`);
  }

  if (hasControlAccess) {
    redirect(`/hosted-matches/${match.id}/control`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{match.title}</h1>
      <p className="text-sm text-[var(--text-secondary)]">
        {match.teamA?.name} vs {match.teamB?.name}
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        {match.format} · {match.venue ?? "Venue TBD"}
      </p>

      {match.runtimeMatchId ? (
        <Link
          href={`/match/${match.runtimeMatchId}`}
          className="inline-flex rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
        >
          Open Match Center
        </Link>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">Match center will be available once the match starts.</p>
      )}
    </div>
  );
}
