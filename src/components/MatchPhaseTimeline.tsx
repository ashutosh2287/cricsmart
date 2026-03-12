"use client";

import { getNarrativeState } from "@/services/narrative/narrativeEngine";

type Props = {
  matchId: string;
};

export default function MatchPhaseTimeline({ matchId }: Props) {

  const state = getNarrativeState(matchId, "main");

  if (!state) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
        <h3 className="text-sm text-gray-400 uppercase mb-2">
          Match Phases
        </h3>
        <div className="text-gray-500 text-sm">
          Waiting for narrative data...
        </div>
      </div>
    );
  }

  const phases = [
    {
      name: "Momentum",
      value: state.momentumScore
    },
    {
      name: "Pressure",
      value: state.pressureScore
    }
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">

      <h3 className="text-sm text-gray-400 uppercase mb-3">
        Match Phases
      </h3>

      {phases.map((p, i) => (

        <div key={i} className="mb-3">

          <div className="flex justify-between text-xs mb-1">
            <span>{p.name}</span>
            <span>{p.value}</span>
          </div>

          <div className="w-full bg-gray-700 h-2 rounded">

            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${Math.min(100, p.value * 10)}%` }}
            />

          </div>

        </div>

      ))}

    </div>
  );
}