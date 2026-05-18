import Link from "next/link";
import { listTeamsByOwner } from "@/lib/repositories/team.repository";
import { requireAuthenticatedPageSession } from "@/services/auth/pageAuth";

export default async function AccountTeamsPage() {
  const session = await requireAuthenticatedPageSession("/account/teams");
  const teams = await listTeamsByOwner(session.userId);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">My Teams</h1>
        <Link href="/teams/create" className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
          Create Team
        </Link>
      </div>

      <div className="space-y-3">
        {teams.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">You have not created any teams yet.</p>
        ) : (
          teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
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
