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

  return (
    <div className="space-y-6">

      {/* 🧮 SCORING */}
      <GlassPanel>
        <h3 className="text-lg font-semibold mb-3">Admin Scoring Panel</h3>
        <AdminScoringPanel matchId={matchId} />
      </GlassPanel>

      {/* 📡 BROADCAST */}
      <div className="grid gap-6 xl:grid-cols-2">
        <GlassPanel>
          <h3 className="mb-3 font-semibold">Director Panel</h3>
          <BroadcastDirectorPanel />
        </GlassPanel>

        <GlassPanel>
          <h3 className="mb-3 font-semibold">Broadcast Control</h3>
          <BroadcastControlDashboard />
        </GlassPanel>
      </div>

      {/* 🎮 SIMULATION */}
      <GlassPanel>
        <h3 className="mb-3 font-semibold">Simulation Controls</h3>

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
            }}
          />
        ) : (
          <div className="p-3 bg-green-500/10 rounded-xl">
            {matchMeta.teamA.name} vs {matchMeta.teamB.name}
          </div>
        )}

        {matchMeta && !tossData && (
          <TossPanel
            teamA={{ name: matchMeta.teamA.name } as Team}
            teamB={{ name: matchMeta.teamB.name } as Team}
            onConfirm={(winner, decision) => {
              setTossData({ winner, decision });
            }}
          />
        )}

        {/* START BUTTON */}
        <button
  onClick={async () => {
    if (!matchMeta || !tossData) {
      alert("⚠️ Complete team selection and toss first");
      return;
    }

    setIsStarting(true);
    setStartError(null);

    try {
      const res = await fetch("/api/start-simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          teamAName: matchMeta.teamA.name,
          teamBName: matchMeta.teamB.name,
          tossWinner: tossData.winner.name,
          tossDecision: tossData.decision,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
  throw new Error(data?.error || "Failed to start simulation");
}

setIsRunning(true);

// 🔥 AUTO REDIRECT
router.push(`/match/${matchId}`);

    } catch (err) {
      console.error("❌ Start error:", err);
    } finally {
      setIsStarting(false);
    }
  }}
  disabled={!matchMeta || !tossData || isStarting}
  className="mt-4 bg-green-600 px-4 py-2 rounded-xl disabled:opacity-50"
>
  {isStarting ? "Starting..." : "Start Simulation"}
</button>

      </GlassPanel>
    </div>
  );
}