import type { MomentumState } from "../types/commentary.types";

type MomentumInput = {
  recentRuns: number;
  recentWickets: number;
  recentBoundaryCount: number;
  scoringAcceleration: number;
  dotBallStreak: number;
  previousMomentumTeam?: string | null;
  battingTeam: string;
  bowlingTeam: string;
};

export type MomentumResult = {
  state: MomentumState;
  score: number;
  swingDetected: boolean;
  momentumTeam: string | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateMomentum(input: MomentumInput): MomentumResult {
  const score = clamp(
    input.recentRuns * 2 +
      input.recentBoundaryCount * 9 +
      input.scoringAcceleration * 6 -
      input.recentWickets * 18 -
      input.dotBallStreak * 4,
    -100,
    100,
  );

  let state: MomentumState = "NEUTRAL";
  let momentumTeam: string | null = null;

  if (score >= 20) {
    state = "BATTING";
    momentumTeam = input.battingTeam;
  } else if (score <= -20) {
    state = "BOWLING";
    momentumTeam = input.bowlingTeam;
  }

  const swingDetected =
    Boolean(input.previousMomentumTeam) &&
    Boolean(momentumTeam) &&
    input.previousMomentumTeam !== momentumTeam;

  return {
    state,
    score,
    swingDetected,
    momentumTeam,
  };
}
