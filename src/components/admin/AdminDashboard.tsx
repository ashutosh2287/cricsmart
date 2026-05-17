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
import { startSimulationFromMeta } from "@/services/simulation/startSimulationClient";

export default function AdminDashboard({ matchId }: { matchId: string }) {
  type TossData = {
    winner: { name: string };
    decision: "BAT" | "BOWL";
  };
  const router = useRouter();
  const [tossData, setTossData] = useState<TossData | null>(() => {
    const existingMeta = getMatchMeta(matchId);
    if (!existingMeta?.toss?.winner || !existingMeta?.toss?.decision) {
      return null;
    }
    return {
      winner: { name: existingMeta.toss.winner },
      decision: existingMeta.toss.decision,
    };
  });
  const [matchMeta, setLocalMatchMeta] = useState(() => getMatchMeta(matchId));
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const hasRequiredSetup = Boolean(
    matchMeta?.teamA?.name &&
      matchMeta?.teamB?.name &&
      (tossData?.winner?.name || matchMeta?.toss?.winner) &&
      (tossData?.decision || matchMeta?.toss?.decision)
  );

  const handleStartSimulation = async () => {
    if (isStarting) return;

    const latestMeta = getMatchMeta(matchId) ?? matchMeta;

    if (!latestMeta?.teamA?.name || !latestMeta?.teamB?.name) {
      setStartError("Please select teams first.");
      return;
    }

    const resolvedMeta = {
      ...latestMeta,
      toss: latestMeta.toss ?? {
        winner: tossData?.winner.name ?? "",
        decision: tossData?.decision ?? "BAT",
      },
    };

    setIsStarting(true);
    setStartError(null);

    try {
      await startSimulationFromMeta(matchId, resolvedMeta);
      router.push(`/match/${matchId}?tab=overview`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to start simulation. Please try again.";
      setStartError(message);
      setIsStarting(false);
    }
  };

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
              setStartError(null);
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
              const nextMeta = {
                ...matchMeta,
                toss: { winner: winner.name, decision },
              };
              setMatchMeta(nextMeta);
              setLocalMatchMeta(nextMeta);
              setStartError(null);
            }}
          />
        )}

        {/* START BUTTON */}
        <button
          type="button"
          onClick={handleStartSimulation}
          disabled={!hasRequiredSetup || isStarting}
          className="mt-4 bg-green-600 px-4 py-2 rounded-xl disabled:opacity-50"
        >
          {isStarting ? "Starting..." : "Start Simulation"}
        </button>
        {startError ? (
          <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {startError}
          </div>
        ) : null}

      </GlassPanel>
    </div>
  );
}
