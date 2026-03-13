import { getMomentumTimeline } from "./momentumTimelineEngine";
import { getMatchPhase } from "./matchPhaseEngine";
import { detectTurningPoints } from "./turningPointEngine";
import { getEventStream } from "../matchEngine";

export type MatchInsight = {
  type: "MOMENTUM" | "COLLAPSE" | "PHASE";
  text: string;
};

const insightsStore: Record<string, MatchInsight[]> = {};

export function generateMatchInsights(matchId: string) {

  const insights: MatchInsight[] = [];

  const momentum = getMomentumTimeline(matchId);
  const phase = getMatchPhase(matchId);
  const events = getEventStream(matchId);
  const turningPoints = detectTurningPoints(events);

  /*
  ================================
  Momentum Insight
  ================================
  */

  if (momentum.length > 6) {

    const last = momentum[momentum.length - 1];

    if (last.momentum > 3) {
      insights.push({
        type: "MOMENTUM",
        text: "Batting side has seized strong momentum."
      });
    }

    if (last.momentum < -3) {
      insights.push({
        type: "MOMENTUM",
        text: "Bowling side has taken control of the match."
      });
    }

  }

  /*
  ================================
  Turning Point Insight
  ================================
  */

  if (turningPoints.length > 0) {

    insights.push({
      type: "COLLAPSE",
      text: "A critical turning point shifted the match balance."
    });

  }

  /*
  ================================
  Match Phase Insight
  ================================
  */

  if (phase?.phase) {

    insights.push({
      type: "PHASE",
      text: `The match is currently in ${phase.phase.replaceAll("_", " ")} phase.`
    });

  }

  insightsStore[matchId] = insights;

}

export function getMatchInsights(matchId: string) {
  return insightsStore[matchId] ?? [];
}