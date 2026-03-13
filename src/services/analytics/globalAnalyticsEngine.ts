import { getMatchIntelligence } from "./matchIntelligenceGraph";
import { getPlayerStats } from "./playerStatsEngine";
import { getPlayerImpact } from "./playerImpactEngine";
import { getMomentumTimeline } from "./momentumTimelineEngine";

export type GlobalAnalytics = {
  topRunScorers: { playerId: string; runs: number }[];
  topImpactPlayers: { playerId: string; impact: number }[];
  momentumLeaders: { matchId: string; score: number }[];
  matchControlLeader?: {
    matchId: string;
    control: number;
  };
};

const globalAnalyticsStore: GlobalAnalytics = {
  topRunScorers: [],
  topImpactPlayers: [],
  momentumLeaders: []
};

export function computeGlobalAnalytics(matchIds: string[]) {

  const runMap: Record<string, number> = {};
  const impactMap: Record<string, number> = {};
  const momentumMap: Record<string, number> = {};

  let controlLeader:
    | { matchId: string; control: number }
    | undefined;

  matchIds.forEach((matchId) => {

    const stats = getPlayerStats(matchId) ?? {};
    const momentumTimeline = getMomentumTimeline(matchId);

let momentumScore = 0;

momentumTimeline.forEach((p) => {
  momentumScore += Math.abs(p.momentum);
});

momentumMap[matchId] = momentumScore;

    /*
    ========================================
    RUN AGGREGATION
    ========================================
    */

    Object.entries(stats).forEach(([playerId, playerStats]) => {

      let runs = 0;

      if (
        typeof playerStats === "object" &&
        playerStats !== null
      ) {

        if ("runs" in playerStats) {
          runs = Number((playerStats as { runs: number }).runs);
        } else if ("totalRuns" in playerStats) {
          runs = Number(
            (playerStats as { totalRuns: number }).totalRuns
          );
        }

      }

      runMap[playerId] =
        (runMap[playerId] ?? 0) + runs;

    });

    /*
    ========================================
    PLAYER IMPACT AGGREGATION
    ========================================
    */

    Object.keys(stats).forEach((playerId) => {

      const impact = getPlayerImpact(matchId, playerId);

      if (typeof impact === "number") {

        impactMap[playerId] =
          (impactMap[playerId] ?? 0) + impact;

      }

    });

    /*
    ========================================
    MATCH CONTROL LEADER
    ========================================
    */

    const intelligence = getMatchIntelligence(matchId);

    if (intelligence) {

      const control = intelligence.battingControl;

      if (!controlLeader || control > controlLeader.control) {

        controlLeader = {
          matchId,
          control
        };

      }

    }

  });

  /*
  ========================================
  TOP RUN SCORERS
  ========================================
  */

  globalAnalyticsStore.topRunScorers = Object.entries(runMap)
    .map(([playerId, runs]) => ({ playerId, runs }))
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5);

    globalAnalyticsStore.momentumLeaders = Object.entries(momentumMap)
  .map(([matchId, score]) => ({ matchId, score }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

  /*
  ========================================
  TOP IMPACT PLAYERS
  ========================================
  */

  globalAnalyticsStore.topImpactPlayers = Object.entries(impactMap)
    .map(([playerId, impact]) => ({ playerId, impact }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);

  globalAnalyticsStore.matchControlLeader = controlLeader;

}

export function getGlobalAnalytics(): GlobalAnalytics {
  return globalAnalyticsStore;
}