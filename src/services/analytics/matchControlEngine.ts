import { getProbabilityTimeline } from "../winProbabilityTimeline";
import { getMomentumTimeline } from "./momentumTimelineEngine";

export type MatchControlResult = {
  battingControl: number;
  bowlingControl: number;
};

export function computeMatchControl(matchId: string): MatchControlResult {

  const probTimeline = getProbabilityTimeline(matchId);
  const momentumTimeline = getMomentumTimeline(matchId);

  if (!probTimeline.length) {
    return {
      battingControl: 50,
      bowlingControl: 50
    };
  }

  let battingScore = 0;
  let bowlingScore = 0;

  for (let i = 0; i < probTimeline.length; i++) {

    const prob = probTimeline[i];

    const momentum =
      momentumTimeline[i]?.momentum ?? 0;

    // Win probability weight
    battingScore += prob.battingProbability;
    bowlingScore += prob.bowlingProbability;

    // Momentum weight (scaled)
    if (momentum > 0) battingScore += momentum * 2;
    if (momentum < 0) bowlingScore += Math.abs(momentum) * 2;

  }

  const total = battingScore + bowlingScore;

  if (total === 0) {
    return { battingControl: 50, bowlingControl: 50 };
  }

  const battingControl =
    (battingScore / total) * 100;

  return {
    battingControl,
    bowlingControl: 100 - battingControl
  };

}