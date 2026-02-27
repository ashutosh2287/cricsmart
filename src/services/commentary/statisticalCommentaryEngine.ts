import { MatchState } from "../matchEngine";
import { computeChasePressure } from "../pressureEngine";

export type StatisticalCommentary = {
  text: string;
  tone: "CALM" | "NEUTRAL" | "AGGRESSIVE";
} | null;

export function computeStatisticalCommentary(
  state: MatchState
): StatisticalCommentary {

  const current =
    state.innings[state.currentInningsIndex];

  // -------------------------------
  // Milestone Detection
  // -------------------------------

  if (current.runs > 0 && current.runs % 50 === 0) {
    return {
      text: `${current.runs} runs on the board. Important milestone reached.`,
      tone: "NEUTRAL"
    };
  }

  // -------------------------------
  // Required Rate Spike
  // -------------------------------

  const chase = computeChasePressure(state);

  if (chase && chase.requiredRunRate > 12) {
    return {
      text: `Required rate climbs to ${chase.requiredRunRate.toFixed(1)}!`,
      tone: "AGGRESSIVE"
    };
  }

  // -------------------------------
  // Death Overs Alert
  // -------------------------------

  if (
    state.configOvers !== null &&
    current.over >= state.configOvers - 3
  ) {
    return {
      text: "We are into the death overs now.",
      tone: "NEUTRAL"
    };
  }

  return null;
}