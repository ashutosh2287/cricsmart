"use client";

import { getMatchIntelligence } from "@/services/analytics/matchIntelligenceGraph";
import { computeCurrentPartnership } from "@/services/analytics/partnershipEngine";
import { getMatchPhase } from "@/services/analytics/matchPhaseEngine";

type Props = {
  matchId: string;
};

export default function StrategyDashboard({ matchId }: Props) {

  const intelligence = getMatchIntelligence(matchId);

  const partnership = computeCurrentPartnership(matchId);

  const phase = getMatchPhase(matchId);

  // SAFE DEFAULT VALUES
  const battingControl = intelligence?.battingControl ?? 50;
  const bowlingControl = intelligence?.bowlingControl ?? 50;
  const momentum = intelligence?.momentumSide ?? "BALANCED";
  const pressure = intelligence?.pressureLevel ?? "LOW";

  return (
    <div className="bg-gray-900 border border-gray-800 text-white p-5 rounded-xl space-y-4 shadow-lg">

      <h3 className="text-lg font-bold">
        Strategy Dashboard
      </h3>

      {/* CONTROL SCORE */}

      <div className="space-y-2">

        <div className="flex justify-between text-sm">
          <span>Batting Control</span>
          <span>{battingControl.toFixed(0)}%</span>
        </div>

        <div className="w-full bg-gray-700 h-2 rounded">
          <div
            className="bg-green-500 h-2 rounded"
            style={{ width: `${battingControl}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span>Bowling Control</span>
          <span>{bowlingControl.toFixed(0)}%</span>
        </div>

      </div>

      {/* MOMENTUM */}

      <div className="text-sm">
        Momentum: <b>{momentum}</b>
      </div>

      {/* PRESSURE */}

      <div className="text-sm">
        Pressure Level: <b>{pressure}</b>
      </div>

      {/* MATCH PHASE */}

      {phase && (
        <div className="text-sm">
          Match Phase: <b>{phase.phase.replaceAll("_", " ")}</b>
        </div>
      )}

      {/* PARTNERSHIP */}

      {partnership && (
        <div className="text-sm">
          Partnership: <b>{partnership.runs} runs</b>
        </div>
      )}

    </div>
  );
}