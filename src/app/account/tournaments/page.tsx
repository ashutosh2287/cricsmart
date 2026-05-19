import Link from "next/link";
import { listTournamentsByOrganizer } from "@/lib/repositories/tournament.repository";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

export default async function AccountTournamentsPage() {
  const session = await getRequiredRequestAuthSession();
  const tournaments = await listTournamentsByOrganizer(session.userId);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">My Tournaments</h1>
        <Link href="/tournaments/create" className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
          Create Tournament
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">You have not created tournaments yet.</p>
      ) : (
        <div className="space-y-3">
          {tournaments.map((tournament) => (
            <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <p className="text-base font-semibold text-[var(--text-primary)]">{tournament.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">{tournament.format ?? "Format TBD"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
