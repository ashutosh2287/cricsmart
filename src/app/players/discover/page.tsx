import Link from "next/link";
import { listPlayerProfiles } from "@/lib/repositories/playerProfile.repository";

export default async function DiscoverPlayersPage() {
  const players = await listPlayerProfiles();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Discover Players</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {players.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No player profiles available yet.</p>
        ) : (
          players.map((player) => (
            <Link key={player.id} href={`/players/profiles/${player.id}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <p className="text-base font-semibold text-[var(--text-primary)]">{player.displayName}</p>
              <p className="text-sm text-[var(--text-secondary)]">{player.role ?? "Role TBD"}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
