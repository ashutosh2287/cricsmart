// highlightEngine.ts

import { BallEvent } from "@/types/ballEvent";
import { addHighlight } from "./highlightStore";
import { emitDirectorSignal } from "../directorSignalBus";
import { getEventStream } from "../matchEngine";
import { getMatchState } from "../matchEngine";
import { computeWinProbability } from "../winProbabilityEngine";

/*
================================================
LOCAL MEMORY (per match)
Used for simple contextual highlight detection
================================================
*/

const wicketStreak: Record<string, number> = {};
const sixStreak: Record<string, number> = {};
const partnershipRuns: Record<string, number> = {};
const lastWinProb: Record<string, number | null> = {};

/*
================================================
PROCESS HIGHLIGHT EVENT
================================================
*/

export function processHighlightEvent(
  matchId: string,
  event: BallEvent
) {

  if (!event.valid) return;

  // Initialize memory
  if (!wicketStreak[matchId]) wicketStreak[matchId] = 0;
  if (!sixStreak[matchId]) sixStreak[matchId] = 0;
  if (!partnershipRuns[matchId]) partnershipRuns[matchId] = 0;

  /*
  ------------------------------------------------
  WICKET HIGHLIGHT
  ------------------------------------------------
  */

  if (event.wicket) {

    wicketStreak[matchId]++;
    sixStreak[matchId] = 0;

    const highlightId = `${event.id}_WICKET`;

    addHighlight(matchId, {
      id: highlightId,
      type: "WICKET",
      event
    });

    emitDirectorSignal({
      type: "HIGHLIGHT_DETECTED",
      matchId,
      branchId: "main",
      eventId: event.id,
      subtype: "WICKET"
    });

    return;
  }

  /*
  ------------------------------------------------
  SIX HIGHLIGHT
  ------------------------------------------------
  */

  if (event.type === "SIX") {

    sixStreak[matchId]++;
    wicketStreak[matchId] = 0;

    const highlightId = `${event.id}_SIX`;

    addHighlight(matchId, {
      id: highlightId,
      type: "SIX",
      event
    });

    emitDirectorSignal({
      type: "HIGHLIGHT_DETECTED",
      matchId,
      branchId: "main",
      eventId: event.id,
      subtype: "SIX"
    });

    return;
  }

 
/*
------------------------------------------------
LAST OVER THRILLER
------------------------------------------------
*/

const events = getEventStream(matchId);

if (events.length >= 6) {

  const lastOverEvents = events.slice(-6);

  const runs = lastOverEvents.reduce(
    (sum: number, e: BallEvent) => sum + (e.runs ?? 0),
    0
  );

  const wickets = lastOverEvents.filter(
    (e: BallEvent) => e.wicket
  ).length;

  if (runs >= 8 || wickets >= 2) {

    addHighlight(matchId, {
      id: `${event.id}_THRILLER`,
      type: "LAST_OVER_THRILLER",
      event
    });

  }


}

/*
------------------------------------------------
PARTNERSHIP TRACKING
------------------------------------------------
*/

partnershipRuns[matchId] += event.runs ?? 0;

if (event.wicket) {
  partnershipRuns[matchId] = 0;
}

/*
------------------------------------------------
BIG PARTNERSHIP (50)
------------------------------------------------
*/

if (partnershipRuns[matchId] === 50) {

  addHighlight(matchId, {
    id: `${event.id}_PARTNERSHIP50`,
    type: "BIG_PARTNERSHIP",
    event
  });

}

/*
------------------------------------------------
DOMINANT PARTNERSHIP (100)
------------------------------------------------
*/

if (partnershipRuns[matchId] === 100) {

  addHighlight(matchId, {
    id: `${event.id}_PARTNERSHIP100`,
    type: "DOMINANT_PARTNERSHIP",
    event
  });

}

/*
------------------------------------------------
TURNING POINT DETECTION
------------------------------------------------
*/

const matchState = getMatchState(matchId);

if (matchState) {

  const probability = computeWinProbability(matchState);

  if (probability) {

    const current = probability.battingWinProbability;

    const previous = lastWinProb[matchId];

    if (
      previous !== null &&
      previous !== undefined &&
      Math.abs(current - previous) >= 0.20
    ) {

      addHighlight(matchId, {
        id: `${event.id}_TURNING_POINT`,
        type: "TURNING_POINT",
        event
      });

    }

    lastWinProb[matchId] = current;
  }

}

  /*
  ------------------------------------------------
  RESET STREAKS
  ------------------------------------------------
  */

  wicketStreak[matchId] = 0;
  sixStreak[matchId] = 0;
}