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

export default function AdminDashboard({ matchId }: { matchId: string }) {
  
  type TossData = {
  winner: { name: string };
  decision: "BAT" | "BOWL";
};
const router = useRouter();
const [tossData, setTossData] = useState<TossData | null>(null);
  const [matchMeta, setLocalMatchMeta] = useState(() => getMatchMeta(matchId));
  const [isStarting, setIsStarting] = useState(false);

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
  onClick={() => {
  if (!matchMeta || !tossData) {
    alert("⚠️ Complete team selection and toss first");
    return;
  }

  setIsStarting(true);

  // ✅ ONLY THIS
  connectRealtime(matchId);

  // OPTIONAL: redirect if you want
  router.push(`/match/${matchId}`);
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
