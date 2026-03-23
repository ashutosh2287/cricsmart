import { BallEvent } from "@/types/ballEvent";
import { addHighlight } from "./highlightStore";
import { emitDirectorSignal } from "../directorSignalBus";
import { getMatchState } from "../matchEngine";
import { computeWinProbability } from "../winProbabilityEngine";

const wicketStreak: Record<string, number> = {};
const boundaryStreak: Record<string, number> = {};
const partnershipRuns: Record<string, number> = {};
const lastWinProb: Record<string, number | null> = {};
const lastOverRuns: Record<string, number[]> = {};

// 🔥 NEW: cooldown system (prevents spam)
const lastHighlightTime: Record<string, number> = {};

function canTrigger(matchId: string, cooldown = 4000) {
  const now = Date.now();
  const last = lastHighlightTime[matchId] ?? 0;

  if (now - last < cooldown) return false;

  lastHighlightTime[matchId] = now;
  return true;
}

export function processHighlightEvent(
  matchId: string,
  event: BallEvent
) {

  if (!event.valid) return;

  if (!wicketStreak[matchId]) wicketStreak[matchId] = 0;
  if (!boundaryStreak[matchId]) boundaryStreak[matchId] = 0;
  if (!partnershipRuns[matchId]) partnershipRuns[matchId] = 0;
  if (!lastOverRuns[matchId]) lastOverRuns[matchId] = [];

  /*
  -----------------------------------------
  🎯 WICKET
  -----------------------------------------
  */

  if (event.wicket) {

    wicketStreak[matchId]++;
    boundaryStreak[matchId] = 0;

    if (canTrigger(matchId)) {
      addHighlight(matchId, {
        id: `${event.id}_WICKET`,
        type: "WICKET",
        event
      });
    }

    emitDirectorSignal({
      type: "REPLAY_REQUEST",
      matchId,
      branchId: event.branchId ?? "main",
      eventId: event.id,
      replayType: "WICKET"
    });

    // 🔥 PRESSURE WICKET
    if (wicketStreak[matchId] >= 2 && canTrigger(matchId)) {
      addHighlight(matchId, {
        id: `${event.id}_PRESSURE_WICKET`,
        type: "HAT_TRICK_THREAT",
        event
      });
    }

    partnershipRuns[matchId] = 0;
    return;
  }

  /*
  -----------------------------------------
  💥 BOUNDARY EVENTS
  -----------------------------------------
  */

  if (event.type === "FOUR" || event.type === "SIX") {

    boundaryStreak[matchId]++;
    wicketStreak[matchId] = 0;

    if (canTrigger(matchId, 2000)) {
      addHighlight(matchId, {
        id: `${event.id}_${event.type}`,
        type: event.type,
        event
      });
    }

    emitDirectorSignal({
      type: "REPLAY_REQUEST",
      matchId,
      branchId: event.branchId ?? "main",
      eventId: event.id,
      replayType: "BOUNDARY"
    });

    // 🔥 STRONG CLUSTER (3+ boundaries)
    if (boundaryStreak[matchId] >= 3 && canTrigger(matchId)) {
      addHighlight(matchId, {
        id: `${event.id}_BOUNDARY_CLUSTER`,
        type: "BOUNDARY_CLUSTER",
        event
      });
    }

  } else {
    boundaryStreak[matchId] = 0;
  }

  /*
  -----------------------------------------
  🚨 LAST OVER DRAMA (FIXED)
  -----------------------------------------
  */

  if (event.over >= 18) {

    lastOverRuns[matchId].push(event.runs ?? 0);

    if (lastOverRuns[matchId].length > 6) {
      lastOverRuns[matchId].shift();
    }

    const runs = lastOverRuns[matchId].reduce((a, b) => a + b, 0);

    if (runs >= 12 && canTrigger(matchId)) {
      addHighlight(matchId, {
        id: `${event.id}_LAST_OVER`,
        type: "LAST_OVER_THRILLER",
        event
      });
    }
  }

  /*
  -----------------------------------------
  🤝 PARTNERSHIP (SMART)
  -----------------------------------------
  */

  partnershipRuns[matchId] += event.runs ?? 0;

  if (partnershipRuns[matchId] >= 50 && partnershipRuns[matchId] < 55) {
    addHighlight(matchId, {
      id: `${event.id}_PARTNERSHIP50`,
      type: "BIG_PARTNERSHIP",
      event
    });
  }

  if (partnershipRuns[matchId] >= 100 && partnershipRuns[matchId] < 105) {
    addHighlight(matchId, {
      id: `${event.id}_PARTNERSHIP100`,
      type: "DOMINANT_PARTNERSHIP",
      event
    });
  }

  /*
  -----------------------------------------
  ⚡ TURNING POINT (UPGRADED)
  -----------------------------------------
  */

  const matchState = getMatchState(matchId);

  if (matchState) {

    const probability = computeWinProbability(matchState);

    if (probability) {

      const current = probability.battingWinProbability;
      const previous = lastWinProb[matchId];

      // 🔥 REALISTIC SWING (15%+ change)
      if (
        previous !== null &&
        previous !== undefined &&
        Math.abs(current - previous) >= 15 &&
        canTrigger(matchId, 6000)
      ) {

        addHighlight(matchId, {
          id: `${event.id}_TURNING_POINT`,
          type: "TURNING_POINT",
          event
        });

        emitDirectorSignal({
          type: "REPLAY_REQUEST",
          matchId,
          branchId: event.branchId ?? "main",
          eventId: event.id,
          replayType: "TURNING_POINT"
        });

      }

      lastWinProb[matchId] = current;
    }
  }
}