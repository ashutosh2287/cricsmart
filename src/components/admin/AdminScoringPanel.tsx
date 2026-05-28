"use client";

import { useState } from "react";
import { routeAdminCommand } from "@/services/adminCommandRouter";
import { getMatchMeta } from "@/store/matchStore";

type Props = {
  matchId: string;
};

export default function AdminScoringPanel({ matchId }: Props) {

  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");
  const matchMeta = getMatchMeta(matchId);

  if (!matchMeta) {
  return (
    <div className="text-[var(--accent)]">
      ⚠️ Please select teams first in Overview tab
    </div>
  );
}

  function run(runs: number) {
  routeAdminCommand({
    type: "SCORE_RUN",
    slug: matchId,
    runs,
    batsman: striker,
    nonStriker,
    bowler,

    // ✅ ADD THESE
    battingTeam: matchMeta?.teamA.name || "",
bowlingTeam: matchMeta?.teamB.name || "",
  });
}

  

  return (

    <div
      className="p-6 rounded-lg space-y-6 relative z-[9999] pointer-events-auto"
      style={{
        background: "var(--surface)",
        border: "0.5px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        color: "var(--text-1)",
      }}
    >

      <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Admin Scoring Panel
      </h3>

      {/* PLAYER SELECTION */}

      <div className="grid grid-cols-3 gap-3">

        <select
  aria-label="Select striker"
  value={striker}
  onChange={(e) => setStriker(e.target.value)}
  className="bg-[var(--surface-2)] border border-[var(--border-med)] text-[var(--text-1)] p-2 rounded"
>
          <option value="">Select Striker</option>
          <option value="Virat Kohli">Virat Kohli</option>
          <option value="Rohit Sharma">Rohit Sharma</option>
        </select>

        <select
          aria-label="Select non-striker"
          value={nonStriker}
          onChange={(e) => setNonStriker(e.target.value)}
          className="bg-[var(--surface-2)] border border-[var(--border-med)] text-[var(--text-1)] p-2 rounded"
        >
          <option value="">Select Non-Striker</option>
          <option value="Virat Kohli">Virat Kohli</option>
          <option value="Rohit Sharma">Rohit Sharma</option>
        </select>

        <select
          aria-label="Select bowler"
          value={bowler}
          onChange={(e) => setBowler(e.target.value)}
          className="bg-[var(--surface-2)] border border-[var(--border-med)] text-[var(--text-1)] p-2 rounded"
        >
          <option value="">Select Bowler</option>
          <option value="Pat Cummins">Pat Cummins</option>
          <option value="Mitchell Starc">Mitchell Starc</option>
        </select>

      </div>

      {/* RUN BUTTONS */}

      <div className="flex gap-3 flex-wrap">

        {[0, 1, 2, 3].map(r => (
          <button
            key={r}
            onClick={() => run(r)}
            className="bg-blue-600 px-4 py-2 rounded text-[var(--text-inv)]"
          >
            {r}
          </button>
        ))}

  <button
  type="button"
  onMouseDown={(e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🖱️ MOUSEDOWN WORKS");
  }}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    alert("✅ CLICK WORKING");
    console.log("🔥 CLICK WORKING");
  }}
  className="w-full bg-red-600 py-4 rounded text-[var(--text-inv)]"
>
  TEST START MATCH
</button>
        <button
          onClick={() =>
            routeAdminCommand({
              type: "SCORE_FOUR",
              slug: matchId,
              batsman: striker,
              nonStriker,
              bowler,
              battingTeam: matchMeta?.teamA.name || "",
              bowlingTeam: matchMeta?.teamB.name || "",
            })
          }
          className="bg-green-600 px-4 py-2 rounded text-[var(--text-inv)]"
        >
          4
        </button>

        <button
          onClick={() =>
            routeAdminCommand({
              type: "SCORE_SIX",
              slug: matchId,
              batsman: striker,
              nonStriker,
              bowler,
              battingTeam: matchMeta?.teamA.name || "",
              bowlingTeam: matchMeta?.teamB.name || "",
            })
          }
          className="bg-purple-600 px-4 py-2 rounded text-[var(--text-inv)]"
        >
          6
        </button>

      </div>

      {/* WICKET / EXTRAS */}

      <div className="flex gap-3 flex-wrap">

        <button
          onClick={() =>
            routeAdminCommand({
              type: "SCORE_WICKET",
              slug: matchId,
              batsman: striker,
              nonStriker,
              bowler,
              battingTeam: matchMeta?.teamA.name || "",
              bowlingTeam: matchMeta?.teamB.name || "",
            })
          }
          className="bg-red-600 px-4 py-2 rounded text-[var(--text-inv)]"
        >
          Wicket
        </button>

        <button
          onClick={() =>
            routeAdminCommand({
              type: "SCORE_WIDE",
              slug: matchId,
              batsman: striker,
              nonStriker,
              bowler,
              battingTeam: matchMeta?.teamA.name || "",
              bowlingTeam: matchMeta?.teamB.name || "",
            })
          }
          className="bg-yellow-600 px-4 py-2 rounded text-[var(--text-inv)]"
        >
          Wide
        </button>

        <button
          onClick={() =>
            routeAdminCommand({
              type: "SCORE_NOBALL",
              slug: matchId,
              batsman: striker,
              nonStriker,
              bowler,
              battingTeam: matchMeta?.teamA.name || "",
              bowlingTeam: matchMeta?.teamB.name || "",
            })
          }
          className="bg-orange-600 px-4 py-2 rounded text-[var(--text-inv)]"
        >
          No Ball
        </button>

      </div>

    </div>

  );

}