import Link from "next/link";
import { listTeams } from "@/lib/repositories/team.repository";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await listTeams();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <span className="gradient-text">Teams</span>
          </h1>
          <p className="text-sm text-[var(--text-2)] mt-1">Manage your cricket teams</p>
        </div>
        <Link
          href="/teams/create"
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[#0077FF] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
        >
          Create Team
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {teams.length === 0 ? (
          <div className="col-span-2 card-cinematic-static p-8 text-center">
            <Users className="w-8 h-8 mx-auto text-[var(--text-3)] mb-3" />
            <p className="text-sm text-[var(--text-3)]">No teams created yet.</p>
          </div>
        ) : (
          teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className="card-cinematic group p-5"
            >
              <p className="text-base font-semibold group-hover:text-[var(--brand)] transition-colors">{team.name}</p>
              <p className="text-sm text-[var(--text-2)]">{team.shortName} {team.city ? `· ${team.city}` : ""}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
