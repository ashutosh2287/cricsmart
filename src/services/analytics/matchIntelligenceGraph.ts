import { getMatchState } from "../matchEngine";
import { computeWinProbability } from "../winProbabilityEngine";
import { computeChasePressure } from "../pressureEngine";
import { computeCurrentPartnership } from "./partnershipEngine";
import { getMatchPhase } from "./matchPhaseEngine";
import { getMomentumTimeline } from "./momentumTimelineEngine";

export type MatchIntelligence = {
  battingControl: number;
  bowlingControl: number;
  pressureLevel: "LOW" | "MEDIUM" | "HIGH";
  dominantPhase?: string;
  momentumSide: "BATTING" | "BOWLING" | "BALANCED";
};

const intelligenceStore: Record<string, MatchIntelligence> = {};

export function getMatchIntelligence(matchId: string) {
  return intelligenceStore[matchId];
}

export function updateMatchIntelligence(matchId: string) {

  const state = getMatchState(matchId);
  if (!state) return;

  const winProb = computeWinProbability(state);
  const chase = computeChasePressure(state);

  const partnership = computeCurrentPartnership(matchId);
  const phase = getMatchPhase(matchId);
  const momentumTimeline = getMomentumTimeline(matchId);

  let battingControl = 50;

  /*
  ========================================
  Win Probability Influence
  ========================================
  */

  if (winProb) {
    battingControl = winProb.battingWinProbability;
  }

  /*
  ========================================
  Partnership Influence
  ========================================
  */

  if (partnership && partnership.runs >= 50) {
    battingControl += 5;
  }

  if (partnership && partnership.runs >= 80) {
    battingControl += 8;
  }

  /*
  ========================================
  Momentum Influence
  ========================================
  */

  const lastMomentum =
    momentumTimeline[momentumTimeline.length - 1]?.momentum ?? 0;

  if (lastMomentum > 2) battingControl += 5;
  if (lastMomentum < -2) battingControl -= 5;

  /*
  ========================================
  Phase Influence
  ========================================
  */

  if (phase?.phase === "BOWLING_DOMINANCE") {
    battingControl -= 6;
  }

  if (phase?.phase === "POWERPLAY_ASSAULT") {
    battingControl += 6;
  }

  /*
  ========================================
  Pressure Influence
  ========================================
  */

  if (chase) {

    if (chase.pressureIndex > 60) {
      battingControl -= 8;
    }

    if (chase.pressureIndex < 30) {
      battingControl += 4;
    }

  }

  battingControl = Math.max(0, Math.min(100, battingControl));

/*
========================================
CONTROL SMOOTHING
========================================
*/

const previous = intelligenceStore[matchId];

if (previous) {
  battingControl =
    previous.battingControl * 0.7 +
    battingControl * 0.3;
}

const bowlingControl = 100 - battingControl;

  /*
  ========================================
  Pressure Level
  ========================================
  */

  let pressureLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

  if (chase) {

    if (chase.pressureIndex > 60) pressureLevel = "HIGH";
    else if (chase.pressureIndex > 30) pressureLevel = "MEDIUM";

  }

  /*
  ========================================
  Momentum Side
  ========================================
  */

  let momentumSide: "BATTING" | "BOWLING" | "BALANCED" = "BALANCED";

  if (lastMomentum > 2) momentumSide = "BATTING";
  if (lastMomentum < -2) momentumSide = "BOWLING";

  intelligenceStore[matchId] = {
    battingControl,
    bowlingControl,
    pressureLevel,
    dominantPhase: phase?.phase,
    momentumSide
  };

}