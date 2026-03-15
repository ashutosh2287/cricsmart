import { getMomentumTimeline } from "./momentumTimelineEngine";
import { computeRequiredRunRate } from "./requiredRunRateEngine";
import { getMatchPhaseTimeline } from "./matchPhaseEngine";

export type SituationInsight = {
  type: string;
  text: string;
};

const situationStore: Record<string, SituationInsight[]> = {};

export function detectMatchSituations(matchId: string) {

  const insights: SituationInsight[] = [];

  const momentum = getMomentumTimeline(matchId);
  const lastMomentum = momentum[momentum.length - 1];

  const phaseTimeline = getMatchPhaseTimeline(matchId);
  const currentSegment =
  phaseTimeline[phaseTimeline.length - 1];

const currentPhase = currentSegment?.phase;
  const rrr = computeRequiredRunRate(matchId, 180);

  /*
  ===============================
  Death Overs Pressure
  ===============================
  */

  if (
    currentPhase === "DEATH_OVERS_PRESSURE" &&
    rrr &&
    rrr.requiredRunRate > 10
  ) {

    insights.push({
      type: "death_pressure",
      text: "Death overs pressure building"
    });

  }

  /*
  ===============================
  Bowling Dominance
  ===============================
  */

  if (
    currentPhase === "BOWLING_DOMINANCE" &&
    typeof lastMomentum === "number" &&
    lastMomentum < -4
  ) {

    insights.push({
      type: "bowling_dominance",
      text: "Bowling side dominating the phase"
    });

  }

  /*
  ===============================
  Batting Acceleration
  ===============================
  */

  if (
    typeof lastMomentum === "number" &&
    lastMomentum > 5
  ) {

    insights.push({
      type: "batting_acceleration",
      text: "Batting acceleration detected"
    });

  }

  situationStore[matchId] = insights;

}

export function getSituationInsights(matchId: string) {

  return situationStore[matchId] ?? [];

}