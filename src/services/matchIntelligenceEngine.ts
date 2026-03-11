import { BallEvent } from "@/types/ballEvent";
import { MatchState, getEventStream } from "./matchEngine";

import { processAnalyticsEvent } from "./analytics/analyticsEngine";
import { processHighlightEvent } from "./highlights/highlightEngine";
import { processNarrativeEvent } from "./narrative/narrativeEngine";
import { processCommentaryEvent } from "./commentary/commentaryEngine";
import { runTacticalEngine } from "./tacticalEngine";
import { analyzeHighlightTimeline } from "./highlightTimelineEngine";
import { updateWinProbabilityTimeline } from "./winProbabilityTimeline";
import { detectTurningPoints } from "./analytics/turningPointEngine";

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

  /*
  ========================================
  Analytics Engine
  ========================================
  */

  processAnalyticsEvent(matchId, ballEvent);

  updateWinProbabilityTimeline(matchId);

  /*
  ========================================
  Highlight Detection
  ========================================
  */

  processHighlightEvent(matchId, ballEvent);

  analyzeHighlightTimeline(matchId);

  /*
  ========================================
  Narrative Engine
  ========================================
  */

  processNarrativeEvent(matchId, ballEvent);

  /*
  ========================================
  Tactical Engine
  ========================================
  */

  runTacticalEngine(matchId, branchId, state);

  /*
  ========================================
  Turning Point Detection
  ========================================
  */

  const events = getEventStream(matchId);
  detectTurningPoints(events);

  /*
  ========================================
  Commentary Engine
  ========================================
  */

  processCommentaryEvent(
    matchId,
    branchId,
    ballEvent
  );
}