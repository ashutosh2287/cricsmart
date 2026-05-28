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
      <div className="glass-panel p-5">
        <h3 className="text-sm text-[var(--text-3)] uppercase mb-2">
          Match Phases
        </h3>
        <div className="text-[var(--text-3)] text-sm">
          Waiting for narrative data...
        </div>
      </div>
    );
  }

  const momentum = narrative.momentumScore ?? 0;
  const pressure = narrative.pressureScore ?? 0;

  const control = intelligence?.battingControl ?? 50;

  return (
    <div
      className="rounded-xl p-4 shadow-lg space-y-4"
      style={{ background: "var(--surface)", border: "0.5px solid var(--border)", color: "var(--text-1)" }}
    >

      <h3 className="text-sm text-[var(--text-3)] uppercase">
        Match Phases
      </h3>

      {/* CURRENT PHASE */}

      {phase && (
        <div className="text-xs text-[var(--text-2)]">
          Phase:{" "}
          <span className="font-semibold text-[var(--text-1)]">
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

        <div className="w-full h-2 rounded" style={{ background: "var(--surface-3)" }}>
          <div
            className="h-2 rounded"
            style={{ width: `${control}%`, background: "var(--brand)" }}
          />
        </div>

      </div>

      {/* MOMENTUM */}

      <div>

        <div className="flex justify-between text-xs mb-1">
          <span>Momentum</span>
          <span>{momentum}</span>
        </div>

        <div className="w-full h-2 rounded" style={{ background: "var(--surface-3)" }}>
          <div
            className="h-2 rounded"
            style={{ width: `${Math.min(100, momentum * 10)}%`, background: "var(--brand)" }}
          />
        </div>

      </div>

      {/* PRESSURE */}

      <div>

        <div className="flex justify-between text-xs mb-1">
          <span>Pressure</span>
          <span>{pressure}</span>
        </div>

        <div className="w-full h-2 rounded" style={{ background: "var(--surface-3)" }}>
          <div
            className="h-2 rounded"
            style={{ width: `${Math.min(100, pressure * 10)}%`, background: "var(--danger)" }}
          />
        </div>

      </div>

    </div>
  );
}
