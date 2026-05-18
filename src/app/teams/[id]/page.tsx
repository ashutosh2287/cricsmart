import Link from "next/link";
import { notFound } from "next/navigation";
import TeamEngagementButtons from "@/components/teams/TeamEngagementButtons";
import { getTeamById } from "@/lib/repositories/team.repository";

export const dynamic = "force-dynamic";

export default async function TeamProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await getTeamById(id);

  if (!team) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{team.name}</h1>
        <Link href="/teams" className="text-sm text-[var(--text-secondary)]">Back to teams</Link>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">
        {team.shortName} {team.city ? `· ${team.city}` : ""}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-[var(--border-subtle)] p-3">
          <p className="text-xs text-[var(--text-secondary)]">Followers</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{team._count.followers}</p>
        </div>
        <div className="rounded-md border border-[var(--border-subtle)] p-3">
          <p className="text-xs text-[var(--text-secondary)]">Favorites</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">{team._count.favorites}</p>
        </div>
      </div>

      <TeamEngagementButtons teamId={team.id} />
    </div>
  );
}
