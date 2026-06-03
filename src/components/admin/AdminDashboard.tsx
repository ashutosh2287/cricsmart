"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import AdminScoringPanel from "./AdminScoringPanel";
import BroadcastControlDashboard from "@/components/BroadcastControlDashboard";
import TeamSelector from "@/components/teams/TeamSelector";
import TossPanel from "@/components/match/TossPanel";
import GlassPanel from "@/components/ui/GlassPanel";
import { Team } from "@/data/teams";
import { getMatchMeta, setMatchMeta } from "@/store/matchStore";
import { connectRealtime } from "@/services/realtime/connectRealtime";
import type { SimulationLifecycleState } from "@/services/simulation/simulation-lifecycle";

export default function AdminDashboard({ matchId }: { matchId: string }) {
  type TossData = {
    winner: { name: string };
    decision: "BAT" | "BOWL";
  };
  
  const router = useRouter();
  const [tossData, setTossData] = useState<TossData | null>(null);
  const [matchMeta, setLocalMatchMeta] = useState(() => getMatchMeta(matchId));
  const [isStarting, setIsStarting] = useState(false);

  async function updateLifecycle(lifecycle: SimulationLifecycleState) {
    await fetch("/api/simulation/lifecycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, lifecycle }),
    });
  }

  return (
    <div className="space-y-6" style={{
      color: "white",
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        .admin-glass-section {
          background: #0A1220 !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 16px !important;
          padding: 1.5rem !important;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
        }
        .admin-section-title {
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #00E5FF;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .meta-team-badge {
          background: rgba(0, 229, 255, 0.08);
          border: 1px solid rgba(0, 229, 255, 0.2);
          color: #00E5FF;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          letter-spacing: 0.02em;
          display: inline-block;
        }
        .btn-simulation-start {
          background: #00E5FF;
          color: #040A14;
          font-weight: 700;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn-simulation-start:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .btn-simulation-start:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      {/* 🧮 SCORING PANEL */}
      <div className="admin-glass-section">
        <h3 className="admin-section-title">
          <span>⚡</span> Scoring Console
        </h3>
        <AdminScoringPanel matchId={matchId} />
      </div>

      {/* 📡 BROADCAST ENGINE CONTROL */}
      <div className="admin-glass-section">
        <h3 className="admin-section-title">
          <span>📡</span> Broadcast Operations Center
        </h3>
        <BroadcastControlDashboard />
      </div>

      {/* 🎮 SIMULATION LIFECYCLE MANAGEMENT */}
      <div className="admin-glass-section">
        <h3 className="admin-section-title">
          <span>⚙️</span> Simulation Control Core
        </h3>

        <div className="mb-4">
          {!matchMeta ? (
            <TeamSelector
              onStart={(teamA, teamB) => {
                const nextMeta = {
                  matchId,
                  teamA: { id: teamA.short, name: teamA.name },
                  teamB: { id: teamB.short, name: teamB.name },
                };
                setMatchMeta(nextMeta);
                setLocalMatchMeta(nextMeta);
                void updateLifecycle("CONFIGURING");
              }}
            />
          ) : (
            <div className="meta-team-badge">
              {matchMeta.teamA.name} <span style={{ color: "rgba(255,255,255,0.4)" }}>VS</span> {matchMeta.teamB.name}
            </div>
          )}
        </div>

        {matchMeta && !tossData && (
          <div className="border border-slate-800/80 bg-slate-900/20 p-4 rounded-xl mt-4">
            <TossPanel
              teamA={{ name: matchMeta.teamA.name } as Team}
              teamB={{ name: matchMeta.teamB.name } as Team}
              onConfirm={(winner, decision) => {
                setTossData({ winner, decision });
                const nextMeta = {
                  ...matchMeta,
                  toss: { winner: winner.name, decision },
                };
                setMatchMeta(nextMeta);
                setLocalMatchMeta(nextMeta);
                void updateLifecycle("READY");
              }}
            />
          </div>
        )}

        {/* START BUTTON TRIGGER */}
        <div className="mt-6 pt-4 border-t border-slate-900">
          <button
            onClick={() => {
              if (!matchMeta || !tossData) {
                alert("⚠️ Setup sequence incomplete: Complete team selection and toss parameters first.");
                return;
              }
              void updateLifecycle("INITIALIZING");
              setIsStarting(true);
              connectRealtime(matchId, "admin-dashboard");
              router.push(`/match/${matchId}?tab=live`);
            }}
            disabled={!matchMeta || !tossData || isStarting}
            className="btn-simulation-start"
          >
            {isStarting ? "Initializing Matrices..." : "Engage Live Engine"}
          </button>
        </div>
      </div>
    </div>
  );
}