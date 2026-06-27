"use client";

import { getMatchIntelligence } from "@/services/analytics/matchIntelligenceGraph";
import { computeCurrentPartnership } from "@/services/analytics/partnershipEngine";
import { getMatchPhase } from "@/services/analytics/matchPhaseEngine";
import { Brain, Gauge, Users, Timer } from "lucide-react";

type Props = {
  matchId: string;
};

export default function StrategyDashboard({ matchId }: Props) {

  const intelligence = getMatchIntelligence(matchId);
  const partnership = computeCurrentPartnership(matchId);
  const phase = getMatchPhase(matchId);

  const battingControl = intelligence?.battingControl ?? 50;
  const bowlingControl = intelligence?.bowlingControl ?? 50;
  const momentum = intelligence?.momentumSide ?? "BALANCED";
  const pressure = intelligence?.pressureLevel ?? "LOW";

  const momentumColor = momentum === "BATTING" ? "text-[var(--success)]" : momentum === "BOWLING" ? "text-[var(--danger)]" : "text-[var(--amber)]";
  const pressureColor = pressure === "HIGH" ? "text-[var(--danger)]" : pressure === "MEDIUM" ? "text-[var(--amber)]" : "text-[var(--success)]";

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] p-5 rounded-xl space-y-4">

      {/* AI Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--brand)] flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Strategy Intelligence</h3>
          <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">AI Analysis</p>
        </div>
      </div>

      {/* Control Bars */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-2)]">Batting Control</span>
            <span className="font-mono tabular-nums font-medium">{battingControl.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-[var(--surface-3)] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[var(--success)] h-full rounded-full transition-all duration-500" style={{ width: `${battingControl}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-2)]">Bowling Control</span>
            <span className="font-mono tabular-nums font-medium">{bowlingControl.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-[var(--surface-3)] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[var(--brand)] h-full rounded-full transition-all duration-500" style={{ width: `${bowlingControl}%` }} />
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--surface-3)] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Gauge className="w-3 h-3 text-[var(--text-3)]" />
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Momentum</span>
          </div>
          <p className={`text-sm font-semibold ${momentumColor}`}>{momentum}</p>
        </div>
        <div className="bg-[var(--surface-3)] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Timer className="w-3 h-3 text-[var(--text-3)]" />
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Pressure</span>
          </div>
          <p className={`text-sm font-semibold ${pressureColor}`}>{pressure}</p>
        </div>
      </div>

      {/* Match Phase */}
      {phase && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-2)]">Match Phase</span>
          <span className="font-medium">{phase.phase.replaceAll("_", " ")}</span>
        </div>
      )}

      {/* Partnership */}
      {partnership && (
        <div className="flex items-center justify-between text-sm bg-[var(--surface-3)] rounded-lg p-3">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--text-3)]" />
            <span className="text-[var(--text-2)]">Partnership</span>
          </div>
          <span className="font-mono tabular-nums font-semibold">{partnership.runs} runs</span>
        </div>
      )}
    </div>
  );
}
