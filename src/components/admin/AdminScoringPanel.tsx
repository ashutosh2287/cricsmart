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
      <div className="p-4 border border-amber-900/50 bg-amber-950/10 rounded-xl text-amber-400 text-xs font-medium flex items-center gap-2">
        <span>⚠️</span> System Pending Setup: Please select running match parameters below in the configuration core view.
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
      battingTeam: matchMeta?.teamA.name || "",
      bowlingTeam: matchMeta?.teamB.name || "",
    });
  }

  return (
    <div className="space-y-6">
      <style>{`
        .sc-select-field {
          background: #111B2B;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #E2E8F0;
          padding: 0.65rem;
          border-radius: 8px;
          font-size: 0.85rem;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .sc-select-field:focus {
          border-color: #00E5FF;
        }
        .sc-label {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748B;
          margin-bottom: 0.35rem;
          font-weight: 600;
        }
        .btn-score-metric {
          background: #1E293B;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: white;
          font-weight: 600;
          font-family: monospace;
          padding: 0.5rem 1.25rem;
          font-size: 0.9rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-score-metric:hover {
          background: #00E5FF;
          color: #040A14;
          border-color: #00E5FF;
        }
        .btn-score-special {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-score-special:hover { opacity: 0.9; }
      `}</style>

      {/* PLAYER CONFIGURATION SELECTORS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="sc-label" htmlFor="striker-select">Striker Batter</label>
          <select
            id="striker-select"
            value={striker}
            onChange={(e) => setStriker(e.target.value)}
            className="sc-select-field"
          >
            <option value="">Select Striker</option>
            <option value="Virat Kohli">Virat Kohli</option>
            <option value="Rohit Sharma">Rohit Sharma</option>
          </select>
        </div>

        <div>
          <label className="sc-label" htmlFor="non-striker-select">Non-Striker Batter</label>
          <select
            id="non-striker-select"
            value={nonStriker}
            onChange={(e) => setNonStriker(e.target.value)}
            className="sc-select-field"
          >
            <option value="">Select Non-Striker</option>
            <option value="Virat Kohli">Virat Kohli</option>
            <option value="Rohit Sharma">Rohit Sharma</option>
          </select>
        </div>

        <div>
          <label className="sc-label" htmlFor="bowler-select">Active Bowler</label>
          <select
            id="bowler-select"
            value={bowler}
            onChange={(e) => setBowler(e.target.value)}
            className="sc-select-field"
          >
            <option value="">Select Bowler</option>
            <option value="Pat Cummins">Pat Cummins</option>
            <option value="Mitchell Starc">Mitchell Starc</option>
          </select>
        </div>
      </div>

      {/* STANDARD RUN INPUT MATRIX */}
      <div className="border-t border-slate-900 pt-4">
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Standard Delivery Input</div>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => run(r)}
              className="btn-score-metric"
            >
              {r} Runs
            </button>
          ))}
          
          <button
            type="button"
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
            className="btn-score-special"
            style={{ background: "#10B981" }}
          >
            4 Boundary
          </button>

          <button
            type="button"
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
            className="btn-score-special"
            style={{ background: "#8B5CF6" }}
          >
            6 Over-Boundary
          </button>
        </div>
      </div>

      {/* MATCH INCIDENTS & EXTRAS */}
      <div className="border-t border-slate-900 pt-4">
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-2">Match Events & Flags</div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
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
            className="btn-score-special"
            style={{ background: "#EF4444" }}
          >
            Out / Wicket
          </button>

          <button
            type="button"
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
            className="btn-score-special"
            style={{ background: "#D97706" }}
          >
            Wide Ball
          </button>

          <button
            type="button"
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
            className="btn-score-special"
            style={{ background: "#EA580C" }}
          >
            No Ball
          </button>
        </div>
      </div>
    </div>
  );
}