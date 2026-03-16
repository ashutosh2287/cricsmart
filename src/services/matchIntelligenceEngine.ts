import { BallEvent } from "@/types/ballEvent";
import { MatchState, getEventStream } from "./matchEngine";

import { processAnalyticsEvent } from "./analytics/analyticsEngine";
import { processHighlightEvent } from "./highlights/highlightEngine";
import { processNarrativeEvent } from "./narrative/narrativeEngine";
import { processCommentaryEvent } from "./commentary/commentaryEngine";

import { runTacticalEngine } from "./tacticalEngine";
import { analyzeHighlightTimeline } from "./highlightTimelineEngine";

import { processMomentumEvent } from "./analytics/momentumTimelineEngine";
import { detectMomentumSwing } from "./analytics/momentumSwingEngine";

import { updateMatchPhase } from "./analytics/matchPhaseEngine";
import { detectTurningPoints } from "./analytics/turningPointEngine";

import { updateMatchIntelligenceGraph } from "./analytics/matchIntelligenceGraphEngine";

import { generateBroadcastInsights } from "./broadcast/broadcastInsightEngine";
import { runTacticalInsightEngine } from "./tactical/tacticalInsightEngine";

import { runMatchPredictor } from "./prediction/matchPredictorEngine";

import { generateReplaySequence } from "./replay/replayDirectorEngine";

import { updatePlayerRegistry } from "./playerRegistryEngine";

import { updatePlayerStats } from "./analytics/playerStatsEngine";

import { updatePlayerImpact } from "./analytics/playerImpactEngine";

import { generateMatchInsights } from "./analytics/matchInsightsEngine";

import { updatePlayerForm } from "./analytics/playerFormEngine";

import { updateWinProbability } from "./analytics/winProbabilityTimelineEngine";

import { generateAIInsights } from "./analytics/aiInsightEngine";

import { detectPatterns } from "./analytics/patternDetectionEngine";

import { detectMatchSituations } from "./analytics/matchSituationEngine";



type IntelligenceInput = {
  matchId: string;
  branchId: string;
  state: MatchState;
  ballEvent: BallEvent;
};

/*
========================================
MATCH INTELLIGENCE PIPELINE
Deterministic execution order
========================================
*/

export function processMatchIntelligence(
  input: IntelligenceInput
) {

  const { matchId, branchId, state, ballEvent } = input;
  const events = getEventStream(matchId);
const ballIndex = events.length - 1;

  /*
========================================
CORE ANALYTICS SIGNALS
========================================
*/

processAnalyticsEvent(matchId, ballEvent);

processMomentumEvent(matchId, ballEvent, ballIndex);

updateWinProbability(matchId, state, ballEvent);

updatePlayerRegistry(matchId);
updatePlayerStats(matchId);
updatePlayerImpact(matchId);
updatePlayerForm(matchId);



  /*
  ========================================
  MOMENTUM SWING DETECTION
  ========================================
  */

  detectMomentumSwing(matchId);

  /*
  ========================================
  MATCH PHASE ENGINE
  ========================================
  */

  updateMatchPhase(matchId);

  /*
  ========================================
  TURNING POINT DETECTION
  ========================================
  */

  detectTurningPoints(events);

  /*
  ========================================
  MATCH INTELLIGENCE GRAPH
  ========================================
  */

  updateMatchIntelligenceGraph(matchId);

  /*
========================================
AI MATCH INSIGHTS
========================================
*/

generateMatchInsights(matchId);

  /*
  ========================================
  HIGHLIGHT DETECTION
  ========================================
  */

  processHighlightEvent(matchId, ballEvent);
  analyzeHighlightTimeline(matchId);

  /*
  ========================================
  NARRATIVE ENGINE
  ========================================
  */

  processNarrativeEvent(matchId, ballEvent);

  /*
  ========================================
  TACTICAL ENGINE
  ========================================
  */

  runTacticalEngine(matchId, branchId, state);

  /*
  ========================================
  TACTICAL INSIGHT ENGINE
  ========================================
  */

  runTacticalInsightEngine(matchId);

  /*
  ========================================
  BROADCAST INSIGHT ENGINE
  ========================================
  */

  generateBroadcastInsights(matchId);

  /*
  ========================================
  PREDICTIVE MATCH SIMULATOR
  ========================================
  */

  runMatchPredictor(matchId);

  /*
  ========================================
  COMMENTARY ENGINE
  ========================================
  */

  processCommentaryEvent(
    matchId,
    branchId,
    ballEvent
  );

  /*
  ========================================
  REPLAY DIRECTOR ENGINE
  ========================================
  */

  generateReplaySequence(matchId);

  generateAIInsights(matchId);

  detectPatterns(matchId);

  detectMatchSituations(matchId);

}