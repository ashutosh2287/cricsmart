"use client";

import { useEffect, useMemo, useState } from "react";

type Player = {
  id: string;
  name: string;
  jerseyNo: number | null;
  role: string;
};

type Props = {
  matchId: string;
  teamA: { slug: string; name: string };
  teamB: { slug: string; name: string };
  onPlayingXISet: () => void;
};

type SquadResponse = { success?: boolean; squad?: Player[]; error?: string };

function PlayerTag({ player }: { player: Player }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-2 py-1 text-xs text-[var(--text-secondary)]">
      {player.jerseyNo !== null ? `#${player.jerseyNo} ` : ""}
      {player.name}
    </span>
  );
}

function TeamSelector({
  title,
  players,
  selected,
  onToggle,
}: {
  title: string;
  players: Player[];
  selected: string[];
  onToggle: (playerId: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] p-3">
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">Select exactly 11 players ({selected.length}/11)</p>

      <div className="mt-3 space-y-2">
        {players.map((player) => {
          const checked = selected.includes(player.id);
          return (
            <label key={player.id} className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(player.id)}
                className="h-4 w-4 rounded border-[var(--border-subtle)]"
              />
              <span>
                {player.jerseyNo !== null ? `#${player.jerseyNo} ` : ""}
                {player.name} ({player.role})
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function PlayingXICard({ matchId, teamA, teamB, onPlayingXISet }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamASquad, setTeamASquad] = useState<Player[]>([]);
  const [teamBSquad, setTeamBSquad] = useState<Player[]>([]);
  const [teamAXI, setTeamAXI] = useState<string[]>([]);
  const [teamBXI, setTeamBXI] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadSquads() {
      setLoading(true);
      setError(null);
      try {
        const [aRes, bRes] = await Promise.all([
          fetch(`/api/teams/${teamA.slug}/squad`, { cache: "no-store" }),
          fetch(`/api/teams/${teamB.slug}/squad`, { cache: "no-store" }),
        ]);

        const [aData, bData] = (await Promise.all([aRes.json(), bRes.json()])) as [
          SquadResponse,
          SquadResponse,
        ];

        if (!aRes.ok || !bRes.ok) {
          if (!cancelled) {
            setError(aData.error ?? bData.error ?? "Failed to load squad players");
          }
          return;
        }

        if (!cancelled) {
          setTeamASquad(aData.squad ?? []);
          setTeamBSquad(bData.squad ?? []);
          setTeamAXI((aData.squad ?? []).slice(0, 11).map((p) => p.id));
          setTeamBXI((bData.squad ?? []).slice(0, 11).map((p) => p.id));
        }
      } catch {
        if (!cancelled) setError("Failed to load squad players");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSquads();
    return () => {
      cancelled = true;
    };
  }, [teamA.slug, teamB.slug]);

  const selectedAPlayers = useMemo(() => {
    const map = new Map(teamASquad.map((p) => [p.id, p]));
    return teamAXI.map((id) => map.get(id)).filter((p): p is Player => Boolean(p));
  }, [teamASquad, teamAXI]);

  const selectedBPlayers = useMemo(() => {
    const map = new Map(teamBSquad.map((p) => [p.id, p]));
    return teamBXI.map((id) => map.get(id)).filter((p): p is Player => Boolean(p));
  }, [teamBSquad, teamBXI]);

  function toggleSelected(current: string[], setter: (value: string[]) => void, playerId: string) {
    if (current.includes(playerId)) {
      setter(current.filter((id) => id !== playerId));
      return;
    }

    if (current.length >= 11) return;
    setter([...current, playerId]);
  }

  async function savePlayingXI() {
    if (saving) return;
    if (teamAXI.length !== 11 || teamBXI.length !== 11) {
      setError("Select exactly 11 players per team");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/hosted-matches/${matchId}/playing-xi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamAXI, teamBXI }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save Playing XI");
        return;
      }

      onPlayingXISet();
    } catch {
      setError("Failed to save Playing XI");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <p className="text-sm text-[var(--text-secondary)]">Loading squad players…</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Playing XI</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Choose 11 players from each team squad before scoring starts.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TeamSelector
          title={teamA.name}
          players={teamASquad}
          selected={teamAXI}
          onToggle={(playerId) => toggleSelected(teamAXI, setTeamAXI, playerId)}
        />
        <TeamSelector
          title={teamB.name}
          players={teamBSquad}
          selected={teamBXI}
          onToggle={(playerId) => toggleSelected(teamBXI, setTeamBXI, playerId)}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">{teamA.name} XI</p>
          <div className="flex flex-wrap gap-1.5">{selectedAPlayers.map((p) => <PlayerTag key={p.id} player={p} />)}</div>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-[var(--text-muted)]">{teamB.name} XI</p>
          <div className="flex flex-wrap gap-1.5">{selectedBPlayers.map((p) => <PlayerTag key={p.id} player={p} />)}</div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={savePlayingXI}
        disabled={saving || teamAXI.length !== 11 || teamBXI.length !== 11}
        className="mt-4 rounded-md bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Playing XI"}
      </button>
    </section>
  );
}
