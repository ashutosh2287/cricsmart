import Link from "next/link";
import { listTeams } from "@/lib/repositories/team.repository";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await listTeams();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Teams</h1>
        <Link href="/teams/create" className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
          Create Team
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {teams.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No teams created yet.</p>
        ) : (
          teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
            >
              <p className="text-base font-semibold text-[var(--text-primary)]">{team.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">{team.shortName} {team.city ? `· ${team.city}` : ""}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
