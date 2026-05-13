import { teams, Team } from "@/data/teams";
import { useMemo, useState } from "react";

type Props = {
  onStart: (teamA: Team, teamB: Team) => void;
};

export default function TeamSelector({ onStart }: Props) {
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");

  const teamA = useMemo(
    () => teams.find((t) => t.name === teamAName) ?? null,
    [teamAName]
  );

  const teamB = useMemo(
    () => teams.find((t) => t.name === teamBName) ?? null,
    [teamBName]
  );

  const sameTeam = !!teamA && !!teamB && teamA.name === teamB.name;
  const canStart = !!teamA && !!teamB && !sameTeam;

  return (
    <div className="space-y-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-[var(--text-primary)]">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Select Teams</h2>

      <div>
        <label htmlFor="teamA" className="mb-1 block text-sm text-[var(--text-secondary)]">
          Team A
        </label>
        <select
          id="teamA"
          value={teamAName}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-[var(--text-primary)]"
          onChange={(e) => setTeamAName(e.target.value)}
        >
          <option value="">Select Team</option>
          {teams.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="teamB" className="mb-1 block text-sm text-[var(--text-secondary)]">
          Team B
        </label>
        <select
          id="teamB"
          value={teamBName}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-[var(--text-primary)]"
          onChange={(e) => setTeamBName(e.target.value)}
        >
          <option value="">Select Team</option>
          {teams.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {sameTeam ? (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          Team A and Team B cannot be the same.
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canStart}
        onClick={() => {
          if (!teamA || !teamB || sameTeam) return;
          console.log("✅ Teams selected:", teamA.name, teamB.name);
          onStart(teamA, teamB);
        }}
        className="w-full rounded-md bg-blue-600 py-2 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Start Match
      </button>
    </div>
  );
}