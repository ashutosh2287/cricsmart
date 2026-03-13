import { NarrativeTimeline } from "../narrative/narrativeTimelineEngine";

export type MatchAnalyticsState = {
  runRate: number[];
  momentum: number[];
  narrative?: NarrativeTimeline;

  // future analytics
  winProbability?: number[];
  matchPhase?: string[];
  turningPoints?: string[];
};

const analyticsState: Record<string, MatchAnalyticsState> = {};

/*
-------------------------------------------------------
INIT
-------------------------------------------------------
*/

export function initMatchAnalytics(matchId: string) {
  analyticsState[matchId] = {
    runRate: [],
    momentum: []
  };
}

/*
-------------------------------------------------------
UPDATE FUNCTIONS
-------------------------------------------------------
*/

export function updateRunRate(
  matchId: string,
  runRate: number
) {
  if (!analyticsState[matchId]) {
    initMatchAnalytics(matchId);
  }

  analyticsState[matchId].runRate.push(runRate);
}

export function updateMomentum(
  matchId: string,
  momentum: number
) {
  if (!analyticsState[matchId]) {
    initMatchAnalytics(matchId);
  }

  analyticsState[matchId].momentum.push(momentum);
}

export function updateNarrative(
  matchId: string,
  narrative: NarrativeTimeline
) {
  if (!analyticsState[matchId]) {
    initMatchAnalytics(matchId);
  }

  analyticsState[matchId].narrative = narrative;
}

/*
-------------------------------------------------------
GET ANALYTICS
-------------------------------------------------------
*/

export function getMatchAnalytics(
  matchId: string
): MatchAnalyticsState {

  return (
    analyticsState[matchId] || {
      runRate: [],
      momentum: []
    }
  );

}

/*
-------------------------------------------------------
RESET
-------------------------------------------------------
*/

export function resetMatchAnalytics(matchId: string) {
  delete analyticsState[matchId];
}