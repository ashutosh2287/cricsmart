"use client";

import { getNarrativeState } from "@/services/narrative/narrativeEngine";
import { getMatchPhase } from "@/services/analytics/matchPhaseEngine";
import { getMatchIntelligence } from "@/services/analytics/matchIntelligenceGraph";

type Props = {
  matchId: string;
};

export default function MatchPhaseTimeline({ matchId }: Props) {

  const narrative = getNarrativeState(matchId, "main");
  const phase = getMatchPhase(matchId);
  const intelligence = getMatchIntelligence(matchId);

  if (!narrative) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg">
        <h3 className="text-sm text-gray-400 uppercase mb-2">
          Match Phases
        </h3>
        <div className="text-gray-500 text-sm">
          Waiting for narrative data...
        </div>
      </div>
    );
  }

  const momentum = narrative.momentumScore ?? 0;
  const pressure = narrative.pressureScore ?? 0;

  const control = intelligence?.battingControl ?? 50;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg space-y-4">

      <h3 className="text-sm text-gray-400 uppercase">
        Match Phases
      </h3>

      {/* CURRENT PHASE */}

      {phase && (
        <div className="text-xs text-gray-300">
          Phase:{" "}
          <span className="font-semibold text-white">
            {phase.phase.replaceAll("_", " ")}
          </span>
        </div>
      )}

      {/* MATCH CONTROL */}

      <div>

        <div className="flex justify-between text-xs mb-1">
          <span>Match Control</span>
          <span>{control.toFixed(0)}%</span>
        </div>

        <div className="w-full bg-gray-700 h-2 rounded">
          <div
            className="bg-green-500 h-2 rounded"
            style={{ width: `${control}%` }}
          />
        </div>

      </div>

      {/* MOMENTUM */}

      <div>

        <div className="flex justify-between text-xs mb-1">
          <span>Momentum</span>
          <span>{momentum}</span>
        </div>

        <div className="w-full bg-gray-700 h-2 rounded">
          <div
            className="bg-blue-500 h-2 rounded"
            style={{ width: `${Math.min(100, momentum * 10)}%` }}
          />
        </div>

      </div>

      {/* PRESSURE */}

      <div>

        <div className="flex justify-between text-xs mb-1">
          <span>Pressure</span>
          <span>{pressure}</span>
        </div>

        <div className="w-full bg-gray-700 h-2 rounded">
          <div
            className="bg-red-500 h-2 rounded"
            style={{ width: `${Math.min(100, pressure * 10)}%` }}
          />
        </div>

      </div>

    </div>
  );
}