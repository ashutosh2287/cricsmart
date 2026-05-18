import Link from "next/link";
import { notFound } from "next/navigation";
import { getHostedMatchById } from "@/lib/repositories/hostedMatch.repository";

export const dynamic = "force-dynamic";

export default async function HostedMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hostedMatch = await getHostedMatchById(id);

  if (!hostedMatch || hostedMatch.visibility !== "PUBLIC") {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{hostedMatch.title}</h1>
      <p className="text-sm text-[var(--text-secondary)]">
        {hostedMatch.teamA.name} vs {hostedMatch.teamB.name}
      </p>
      <p className="text-xs text-[var(--text-muted)]">{hostedMatch.format} · {hostedMatch.venue ?? "Venue TBD"}</p>

      <div className="flex flex-wrap gap-2">
        <Link href={`/match/${hostedMatch.slug}`} className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
          Open Match Center
        </Link>
        <Link href={`/hosted-matches/${hostedMatch.id}/control`} className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
          Control Center
        </Link>
      </div>
    </div>
  );
}
