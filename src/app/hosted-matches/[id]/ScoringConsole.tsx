"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Player = {
  id: string;
  name: string;
  jerseyNo: number | null;
  role: string;
};

type PlayingXI = {
  teamAXI: Player[];
  teamBXI: Player[];
  battingTeam: Player[];
  bowlingTeam: Player[];
  battingTeamName: string;
  bowlingTeamName: string;
};

type Props = {
  matchId: string;
  hostedMatchId: string;
};

function PlayerSelect({
  label,
  players,
  value,
  onChange,
  exclude = [],
}: {
  label: string;
  players: Player[];
  value: string;
  onChange: (id: string) => void;
  exclude?: string[];
}) {
  const available = players.filter((player) => !exclude.includes(player.id) || player.id === value);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
      >
        <option value="">Select {label}</option>
        {available.map((player) => (
          <option key={player.id} value={player.id}>
            {player.jerseyNo !== null ? `#${player.jerseyNo} ` : ""}
            {player.name} ({player.role})
          </option>
        ))}
      </select>
    </div>
  );
}

export function ScoringConsole({ matchId, hostedMatchId }: Props) {
  const [playingXI, setPlayingXI] = useState<PlayingXI | null>(null);
  const [currentInningsIndex, setCurrentInningsIndex] = useState(0);
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");
  const [eventType, setEventType] = useState("RUN");
  const [runs, setRuns] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetSelections = useCallback(() => {
    setStriker("");
    setNonStriker("");
    setBowler("");
  }, []);

  const loadCurrentInningsIndex = useCallback(async () => {
    const res = await fetch(`/api/match/${matchId}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { match?: { currentInningsIndex?: number } };
    const inningsIndex = data.match?.currentInningsIndex ?? 0;
    setCurrentInningsIndex((prev) => {
      if (prev !== inningsIndex) {
        resetSelections();
      }
      return inningsIndex;
    });
  }, [matchId, resetSelections]);

  const loadPlayingXI = useCallback(async () => {
    const res = await fetch(`/api/hosted-matches/${hostedMatchId}/playing-xi`, {
      cache: "no-store",
    });
    if (!res.ok) {
      setPlayingXI(null);
      setError("Playing XI not set yet.");
      return;
    }

    const data = (await res.json()) as { playingXI?: PlayingXI };
    setPlayingXI(data.playingXI ?? null);
    setError(null);
  }, [hostedMatchId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await Promise.all([loadPlayingXI(), loadCurrentInningsIndex()]);
      } catch {
        if (!cancelled) {
          setError("Failed to load scoring context");
        }
      }
    };

    void load();
    const interval = window.setInterval(() => {
      if (!cancelled) {
        void loadCurrentInningsIndex();
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadCurrentInningsIndex, loadPlayingXI]);

  const activeTeams = useMemo(() => {
    if (!playingXI) {
      return null;
    }

    const battingIsTeamA =
      playingXI.battingTeam[0]?.id !== undefined &&
      playingXI.teamAXI.some((player) => player.id === playingXI.battingTeam[0].id);

    const firstInningsBatting = battingIsTeamA ? playingXI.teamAXI : playingXI.teamBXI;
    const firstInningsBowling = battingIsTeamA ? playingXI.teamBXI : playingXI.teamAXI;

    if (currentInningsIndex === 1) {
      return {
        battingTeam: firstInningsBowling,
        bowlingTeam: firstInningsBatting,
        battingTeamName: playingXI.bowlingTeamName,
        bowlingTeamName: playingXI.battingTeamName,
      };
    }

    return {
      battingTeam: firstInningsBatting,
      bowlingTeam: firstInningsBowling,
      battingTeamName: playingXI.battingTeamName,
      bowlingTeamName: playingXI.bowlingTeamName,
    };
  }, [playingXI, currentInningsIndex]);

  const canSubmit = useMemo(() => Boolean(striker && nonStriker && bowler), [striker, nonStriker, bowler]);

  async function handleSubmitBall() {
    if (!canSubmit) {
      setError("Select striker, non-striker, and bowler");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/match/${matchId}/ball`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          runs,
          strikerId: striker,
          nonStrikerId: nonStriker,
          bowlerId: bowler,
          hostedMatchId,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to submit ball");
      } else {
        await loadCurrentInningsIndex();
      }
    } catch {
      setError("Failed to submit ball");
    } finally {
      setSubmitting(false);
    }
  }

  if (!playingXI || !activeTeams) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-secondary)]">
        Loading Playing XI...
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-center">
          <p className="mb-0.5 text-xs text-[var(--text-muted)]">Batting</p>
          <p className="text-sm font-bold text-emerald-400">{activeTeams.battingTeamName}</p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-center">
          <p className="mb-0.5 text-xs text-[var(--text-muted)]">Bowling</p>
          <p className="text-sm font-bold text-blue-400">{activeTeams.bowlingTeamName}</p>
        </div>
      </div>

      <PlayerSelect
        label="Striker (Batsman)"
        players={activeTeams.battingTeam}
        value={striker}
        onChange={setStriker}
        exclude={[nonStriker]}
      />
      <PlayerSelect
        label="Non-Striker"
        players={activeTeams.battingTeam}
        value={nonStriker}
        onChange={setNonStriker}
        exclude={[striker]}
      />
      <PlayerSelect label="Bowler" players={activeTeams.bowlingTeam} value={bowler} onChange={setBowler} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Event Type
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="RUN">Run</option>
            <option value="WIDE">Wide</option>
            <option value="NO_BALL">No Ball</option>
            <option value="BYE">Bye</option>
            <option value="LEG_BYE">Leg Bye</option>
            <option value="WICKET">Wicket</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Runs
          </label>
          <input
            type="number"
            min={0}
            max={6}
            value={runs}
            onChange={(e) => setRuns(Number(e.target.value))}
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
      ) : null}

      <button
        onClick={handleSubmitBall}
        disabled={submitting || !canSubmit}
        className="w-full rounded-md bg-[var(--accent-brand)] py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit Ball Event"}
      </button>
    </div>
  );
}
