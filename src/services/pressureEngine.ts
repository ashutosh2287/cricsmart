import { MatchState } from "./matchEngine";

export type ChaseContext = {
  target: number;
  requiredRuns: number;
  ballsRemaining: number;
  requiredRunRate: number;
  currentRunRate: number;
  pressureIndex: number; // 0–100
};

export function computeChasePressure(
  state: MatchState
): ChaseContext | null {

  // Only for limited overs
  if (state.configOvers === null) return null;

  // Need at least 2 innings
  if (state.innings.length < 2) return null;

  const first = state.innings[0];
  const second = state.innings[1];

  const target = first.runs + 1;
  const requiredRuns = target - second.runs;

  const ballsBowled =
    second.over * 6 + second.ball;

  const totalBalls = state.configOvers * 6;
  const ballsRemaining = totalBalls - ballsBowled;

  if (ballsRemaining <= 0) return null;

  const requiredRunRate =
    (requiredRuns / ballsRemaining) * 6;

  const currentRunRate =
    (second.runs / Math.max(1, ballsBowled)) * 6;

  // Basic deterministic pressure model
  const pressureIndex =
    Math.max(
      0,
      Math.min(
        100,
        (requiredRunRate - currentRunRate) * 10
      )
    );

  return {
    target,
    requiredRuns,
    ballsRemaining,
    requiredRunRate,
    currentRunRate,
    pressureIndex
  };
}