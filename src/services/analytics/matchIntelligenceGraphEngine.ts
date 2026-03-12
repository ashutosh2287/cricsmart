import { getEventStream } from "../matchEngine";
import { getAnalyticsState } from "./analyticsStore";

export type MatchPhase =
  | "BALANCED_PHASE"
  | "BATTING_DOMINANCE"
  | "BOWLING_CONTROL"
  | "COLLAPSE_RISK";

export type MatchIntelligenceState = {
  phase: MatchPhase;
  momentum: number;
  runRate: number;
  collapseRisk: boolean;
};

const intelligenceStore: Record<string, MatchIntelligenceState> = {};

export function getMatchIntelligence(matchId: string) {
  return intelligenceStore[matchId];
}

export function updateMatchIntelligenceGraph(matchId: string) {

  const analytics = getAnalyticsState(matchId);
  if (!analytics) return;

  const events = getEventStream(matchId);

  /*
  ========================================
  Compute Run Rate
  ========================================
  */

  const runRate =
    analytics.balls > 0 ? (analytics.runs / analytics.balls) * 6 : 0;

  /*
  ========================================
  Compute Momentum
  ========================================
  */

  const momentumHistory = analytics.momentumHistory;
  const momentum =
    momentumHistory.length > 0
      ? momentumHistory[momentumHistory.length - 1]
      : 0.5;

  /*
  ========================================
  Collapse Detection
  ========================================
  */

  let collapseRisk = false;

  if (events.length >= 6) {
    const last6 = events.slice(-6);
    const wickets = last6.filter((e) => e.wicket).length;

    if (wickets >= 2) {
      collapseRisk = true;
    }
  }

  /*
  ========================================
  Phase Detection
  ========================================
  */

  let phase: MatchPhase = "BALANCED_PHASE";

  if (collapseRisk) {
    phase = "COLLAPSE_RISK";
  } else if (momentum > 0.65) {
    phase = "BATTING_DOMINANCE";
  } else if (momentum < 0.35) {
    phase = "BOWLING_CONTROL";
  }

  intelligenceStore[matchId] = {
    phase,
    momentum,
    runRate,
    collapseRisk
  };
}