// services/matchEngine.ts

import { BallEvent } from "@/types/ballEvent";
import { pushToTimeline } from "./broadcastTimeline";
import { emitCommand } from "./commandBus";



/*
-------------------------------------------------------
MATCH STATE TYPE
Single source of truth for each match
-------------------------------------------------------
*/

export type MatchState = {
  matchId: string;
  runs: number;
  wickets: number;
  over: number;
  ball: number;
  timeline: BallEvent[];
};

/*
-------------------------------------------------------
INTERNAL ENGINE STORE
-------------------------------------------------------
*/

const matches = new Map<string, MatchState>();

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/*
-------------------------------------------------------
PUBLIC SUBSCRIPTIONS
(UI hooks or stores can listen)
-------------------------------------------------------
*/

export function subscribeMatchEngine(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getMatchState(matchId: string) {
  return matches.get(matchId);
}

/*
-------------------------------------------------------
INITIALIZE MATCH (Call when match starts)
-------------------------------------------------------
*/

export function initMatch(matchId: string) {
  if (matches.has(matchId)) return;

  matches.set(matchId, {
    matchId,
    runs: 0,
    wickets: 0,
    over: 0,
    ball: 0,
    timeline: [],
  });

  emit();
}

/*
-------------------------------------------------------
CORE REDUCER (PURE LOGIC ONLY)
All state updates happen here
-------------------------------------------------------
*/
function reduce(state: MatchState, event: BallEvent): MatchState {

  const next: MatchState = {
    ...state,
    timeline: [...state.timeline, event],
  };

 switch (event.type) {

  case "RUN":
    next.runs += 1;
    next.ball += 1;
    emitCommand({ type: "RUN_SCORED", runs: 1 });
    break;

  case "FOUR":
    next.runs += 4;
    next.ball += 1;
    emitCommand({ type: "BOUNDARY_FOUR" });
    break;

  case "SIX":
    next.runs += 6;
    next.ball += 1;
    emitCommand({ type: "BOUNDARY_SIX" });
    break;

  case "WICKET":
    next.wickets += 1;
    next.ball += 1;
    emitCommand({ type: "WICKET_FALL" });
    break;

  case "WD":
    next.runs += 1;
    return next;

  case "NB":
    next.runs += 1;
    return next;
}


  // Over progression
  if (next.ball >= 6) {
    next.over += 1;
    next.ball = 0;
  }

  return next;
}


/*
-------------------------------------------------------
MAIN ENTRY POINT
ALL events must go through here
-------------------------------------------------------
*/
export function dispatchBallEvent(matchId: string, event: BallEvent) {

  let current = matches.get(matchId);

  /*
  -------------------------------------------------------
  AUTO INITIALIZE (Realtime-safe)
  -------------------------------------------------------
  */

  if (!current) {

    console.warn("Auto-init match:", matchId);

    initMatch(matchId);

    // 🔥 IMPORTANT: fetch again after init
    current = matches.get(matchId)!;
  }

  /*
  -------------------------------------------------------
  REDUCE EVENT
  -------------------------------------------------------
  */

  const updated = reduce(current, event);

  matches.set(matchId, updated);

  /*
  -------------------------------------------------------
  Downstream integrations
  -------------------------------------------------------
  */

  pushToTimeline(event);

  emit();
}

/*
-------------------------------------------------------
OPTIONAL RESET (useful for testing)
-------------------------------------------------------
*/

export function resetMatch(matchId: string) {
  matches.delete(matchId);
  emit();
}
