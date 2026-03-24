import { teams, Team } from "@/data/teams";
import { useState } from "react";

type Props = {
  onStart: (teamA: Team, teamB: Team) => void;
};

export default function TeamSelector({ onStart }: Props) {
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);

  return (
    <div className="bg-gray-900 p-4 rounded-lg text-white space-y-4">

      <h2 className="text-lg font-semibold">
        Select Teams
      </h2>

      {/* TEAM A */}
      <div>
  <label htmlFor="teamA" className="text-sm mb-1 block">
    Team A
  </label>

  <select
    id="teamA"
    className="w-full p-2 bg-gray-800 rounded"
    onChange={(e) => {
      const t = teams.find(t => t.name === e.target.value);
      if (t) setTeamA(t);
    }}
  >
    <option>Select Team</option>
    {teams.map(t => (
      <option key={t.name}>{t.name}</option>
    ))}
  </select>
</div>

      {/* TEAM B */}
      <div>
  <label htmlFor="teamB" className="text-sm mb-1 block">
    Team B
  </label>

  <select
    id="teamB"
    className="w-full p-2 bg-gray-800 rounded"
    onChange={(e) => {
      const t = teams.find(t => t.name === e.target.value);
      if (t) setTeamB(t);
    }}
  >
    <option>Select Team</option>
    {teams.map(t => (
      <option key={t.name}>{t.name}</option>
    ))}
  </select>
</div>

      {/* START BUTTON */}
      <button
        disabled={!teamA || !teamB}
        onClick={() => {
          if (teamA && teamB) onStart(teamA, teamB);
        }}
        className="w-full bg-blue-600 py-2 rounded disabled:opacity-50"
      >
        Start Match
      </button>

    </div>
  );
}