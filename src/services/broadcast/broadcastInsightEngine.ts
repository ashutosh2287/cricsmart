import { getMomentumSwings } from "../analytics/momentumSwingEngine";
import { computeCurrentPartnership } from "../analytics/partnershipEngine";
import { getMatchPhase } from "../analytics/matchPhaseEngine";
import { getEventStream } from "../matchEngine";
import { detectTurningPoints } from "../analytics/turningPointEngine";

export type BroadcastInsight = {
  type:
    | "KEY_MOMENT"
    | "PARTNERSHIP_ALERT"
    | "MOMENTUM_SHIFT"
    | "PHASE_UPDATE"
    | "COLLAPSE_ALERT";

  message: string;

  severity: "LOW" | "MEDIUM" | "HIGH";
};

const insightStore: Record<string, BroadcastInsight[]> = {};

export function getBroadcastInsights(matchId: string) {
  return insightStore[matchId] ?? [];
}

export function generateBroadcastInsights(matchId: string) {

  const insights: BroadcastInsight[] = [];

  const swings = getMomentumSwings(matchId);
  const phase = getMatchPhase(matchId);
  const partnership = computeCurrentPartnership(matchId);

  const events = getEventStream(matchId);
  const turningPoints = detectTurningPoints(events);

  /*
  ========================================
  Momentum Insights
  ========================================
  */

  swings.forEach(s => {

    if (s.type === "BOWLING_STRIKE") {

      insights.push({
        type: "MOMENTUM_SHIFT",
        message: "Two quick wickets have shifted momentum to the bowling side.",
        severity: "HIGH"
      });

    }

    if (s.type === "BATTING_SURGE") {

      insights.push({
        type: "MOMENTUM_SHIFT",
        message: "A burst of boundaries has given the batting side strong momentum.",
        severity: "MEDIUM"
      });

    }

  });

  /*
  ========================================
  Partnership Insight
  ========================================
  */

  if (partnership && partnership.runs >= 50) {

    insights.push({
      type: "PARTNERSHIP_ALERT",
      message: `Partnership building: ${partnership.runs} runs stand.`,
      severity: "MEDIUM"
    });

  }

  if (partnership && partnership.runs >= 80) {

    insights.push({
      type: "PARTNERSHIP_ALERT",
      message: `Dangerous partnership: ${partnership.runs} runs.`,
      severity: "HIGH"
    });

  }

  /*
  ========================================
  Phase Insights
  ========================================
  */

  if (phase) {

    if (phase.phase === "POWERPLAY_ASSAULT") {

      insights.push({
        type: "PHASE_UPDATE",
        message: "Batting side dominating the powerplay.",
        severity: "MEDIUM"
      });

    }

    if (phase.phase === "DEATH_OVERS_ATTACK") {

      insights.push({
        type: "PHASE_UPDATE",
        message: "Explosive hitting in the death overs.",
        severity: "HIGH"
      });

    }

  }

  /*
  ========================================
  Collapse Detection
  ========================================
  */

  const collapse = turningPoints.find(tp => tp.type === "COLLAPSE");

  if (collapse) {

    insights.push({
      type: "COLLAPSE_ALERT",
      message: "Batting side collapsing after losing multiple wickets quickly.",
      severity: "HIGH"
    });

  }

  insightStore[matchId] = insights;

}