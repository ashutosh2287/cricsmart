import { notFound } from "next/navigation";
import { getPlayerProfileById } from "@/lib/repositories/playerProfile.repository";

export default async function PlayerProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getPlayerProfileById(id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{profile.displayName}</h1>
      <p className="text-sm text-[var(--text-secondary)]">Role: {profile.role ?? "TBD"}</p>
      <p className="text-sm text-[var(--text-secondary)]">Batting: {profile.battingStyle ?? "TBD"}</p>
      <p className="text-sm text-[var(--text-secondary)]">Bowling: {profile.bowlingStyle ?? "TBD"}</p>
      <pre className="overflow-auto rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] p-3 text-xs text-[var(--text-secondary)]">
        {JSON.stringify(profile.statsSnapshot ?? {}, null, 2)}
      </pre>
    </div>
  );
}
