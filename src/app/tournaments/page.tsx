import Link from "next/link";
import { listTournamentsPublic } from "@/lib/repositories/tournament.repository";

export default async function TournamentsPage() {
  const tournaments = await listTournamentsPublic();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Tournaments</h1>
        <Link href="/tournaments/create" className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
          Create Tournament
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {tournaments.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No tournaments available.</p>
        ) : (
          tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.id}`}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4"
            >
              <p className="text-base font-semibold text-[var(--text-primary)]">{tournament.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {tournament.format ?? "Format TBD"} {tournament.location ? `· ${tournament.location}` : ""}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
