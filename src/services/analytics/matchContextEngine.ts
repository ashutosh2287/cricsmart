import type { MatchState } from "@/services/matchEngine";

type MatchContext = {
  phase: "POWERPLAY" | "MIDDLE" | "DEATH";
  pressure: number;
  pressureLabel: "LOW" | "MEDIUM" | "HIGH";
  currentRunRate: number;
  wicketsInHand: number;
  isChasing: boolean;
};

export function getMatchContext(state: MatchState): MatchContext {
  const innings = state.innings[state.currentInningsIndex];

  const runs = innings?.runs ?? 0;
  const wickets = innings?.wickets ?? 0;

  // 🔥 FIX: overs is Record<number, BallEvent[]>
  const oversObject = innings?.overs ?? {};
  const overs = Object.keys(oversObject).length;

  // count total balls
  let totalBalls = 0;
  Object.values(oversObject).forEach((over) => {
    totalBalls += over.length;
  });

  const currentRunRate =
    totalBalls > 0 ? (runs / totalBalls) * 6 : 0;

  // ❌ no target in your system → assume first innings for now
  const isChasing = state.currentInningsIndex === 1;

  // 🔥 PHASE
  let phase: MatchContext["phase"] = "POWERPLAY";
  if (overs > 6 && overs <= 15) phase = "MIDDLE";
  if (overs > 15) phase = "DEATH";

  // 🔥 PRESSURE (simplified since no target yet)
  let pressure = 0;

  if (isChasing) {
    pressure = Math.min(currentRunRate / 10, 1);
  }

  let pressureLabel: MatchContext["pressureLabel"] = "LOW";
  if (pressure > 0.7) pressureLabel = "HIGH";
  else if (pressure > 0.4) pressureLabel = "MEDIUM";

  return {
    phase,
    pressure,
    pressureLabel,
    currentRunRate,
    wicketsInHand: 10 - wickets,
    isChasing,
  };
}