"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import AdminScoringPanel from "./AdminScoringPanel";
import BroadcastDirectorPanel from "@/components/BroadcastDirectorPanel";
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
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1500);

  async function updateLifecycle(lifecycle: SimulationLifecycleState) {
    await fetch("/api/simulation/lifecycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, lifecycle }),
    });
  }

  return (
    <div className="space-y-6">

      {/* 🧮 SCORING */}
      <GlassPanel>
        <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--text-1)", fontFamily: "var(--font-display)" }}>
          Admin Scoring Panel
        </h3>
        <AdminScoringPanel matchId={matchId} />
      </GlassPanel>

      {/* 📡 BROADCAST */}
      <div className="grid gap-6 xl:grid-cols-2">
        <GlassPanel>
          <h3 className="mb-3 font-semibold" style={{ color: "var(--text-1)", fontFamily: "var(--font-display)" }}>
            Director Panel
          </h3>
          <BroadcastDirectorPanel />
        </GlassPanel>

        <GlassPanel>
          <h3 className="mb-3 font-semibold" style={{ color: "var(--text-1)", fontFamily: "var(--font-display)" }}>
            Broadcast Control
          </h3>
          <BroadcastControlDashboard />
        </GlassPanel>
      </div>

      {/* 🎮 SIMULATION */}
      <GlassPanel>
        <h3 className="mb-3 font-semibold" style={{ color: "var(--text-1)", fontFamily: "var(--font-display)" }}>
          Simulation Controls
        </h3>

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
          <div className="p-3 rounded-xl" style={{ background: "var(--brand-light)", color: "var(--brand-text)" }}>
            {matchMeta.teamA.name} vs {matchMeta.teamB.name}
          </div>
        )}

        {matchMeta && !tossData && (
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
        )}

        {/* START BUTTON */}
        <button
  onClick={() => {
  if (!matchMeta || !tossData) {
    alert("⚠️ Complete team selection and toss first");
    return;
  }

  console.log("🔥 ADMIN START CLICKED");
  void updateLifecycle("INITIALIZING");

  setIsStarting(true);
  setStartError(null);

  // ✅ ONLY THIS
  connectRealtime(matchId, "admin-dashboard");

  router.push(`/match/${matchId}?tab=live`);
}}
  disabled={!matchMeta || !tossData || isStarting}
  className="mt-4 bg-green-600 px-4 py-2 rounded-xl text-[var(--text-inv)] disabled:opacity-50"
>
  {isStarting ? "Starting..." : "Start Simulation"}
</button>

      </GlassPanel>
    </div>
  );
}
