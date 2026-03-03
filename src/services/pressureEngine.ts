import type { MatchState } from "./matchEngine";

export type DeathLevel =
  | "NONE"
  | "EARLY_DEATH"
  | "CRITICAL"
  | "FINAL_OVER";

export type ChaseContext = {
  target: number;
  requiredRuns: number;
  ballsRemaining: number;
  requiredRunRate: number;
  currentRunRate: number;
  pressureIndex: number; // 0–100

  // 🆕 Death over intelligence
  isDeathOver: boolean;
  deathLevel: DeathLevel;
};

/**
 * Deterministic target-based pressure modeling.
 * Replay-safe. Multi-innings safe.
 */
export function computeChasePressure(
  state: MatchState
): ChaseContext | null {

  // Limited overs only
  if (state.configOvers === null) return null;

  // Need completed first innings + active chase
  if (state.innings.length < 2) return null;

  const first = state.innings[0];
  const second = state.innings[1];

  const target = first.runs + 1;
  const requiredRuns = target - second.runs;

  const ballsBowled =
    second.over * 6 + second.ball;

  const totalBalls = state.configOvers * 6;
  const ballsRemaining = totalBalls - ballsBowled;

  // Chase already finished
  if (requiredRuns <= 0 || ballsRemaining <= 0)
    return null;

  const requiredRunRate =
    (requiredRuns / ballsRemaining) * 6;

  const currentRunRate =
    ballsBowled > 0
      ? (second.runs / ballsBowled) * 6
      : 0;

  const rrrDelta =
    requiredRunRate - currentRunRate;

  const wicketsRemaining =
    10 - second.wickets;

  const wicketPressure =
    (10 - wicketsRemaining) * 2;

  /*
  ========================================================
  DEATH OVER DETECTION
  ========================================================
  */

  let deathLevel: DeathLevel = "NONE";
  let isDeathOver = false;

  if (ballsRemaining <= 6) {
    deathLevel = "FINAL_OVER";
    isDeathOver = true;
  } else if (ballsRemaining <= 12) {
    deathLevel = "CRITICAL";
    isDeathOver = true;
  } else if (ballsRemaining <= 18) {
    deathLevel = "EARLY_DEATH";
    isDeathOver = true;
  }

  /*
  ========================================================
  LATE GAME PRESSURE MULTIPLIER
  ========================================================
  */

  const lateGameMultiplier =
    deathLevel === "FINAL_OVER" ? 1.6 :
    deathLevel === "CRITICAL" ? 1.45 :
    deathLevel === "EARLY_DEATH" ? 1.3 :
    ballsRemaining <= 36 ? 1.15 :
    1;

  /*
  ========================================================
  RAW PRESSURE MODEL
  ========================================================
  */

  const rawPressure =
    (rrrDelta * 12 + wicketPressure) *
    lateGameMultiplier;

  const pressureIndex =
    Math.max(
      0,
      Math.min(100, rawPressure)
    );

  return {
    target,
    requiredRuns,
    ballsRemaining,
    requiredRunRate,
    currentRunRate,
    pressureIndex,
    isDeathOver,
    deathLevel
  };
}