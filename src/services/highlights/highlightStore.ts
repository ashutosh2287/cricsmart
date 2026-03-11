// highlightStore.ts

import { BallEvent } from "@/types/ballEvent";


type HighlightListener = (matchId: string) => void;

const listeners = new Set<HighlightListener>();



/*
================================================
HIGHLIGHT TYPES
================================================
*/

export type HighlightType =
  | "WICKET"
  | "SIX"
  | "FOUR"
  | "HAT_TRICK_THREAT"
  | "BOUNDARY_CLUSTER"
  | "BIG_PARTNERSHIP"
  | "DOMINANT_PARTNERSHIP"
  | "LAST_OVER_THRILLER"
  | "TURNING_POINT"

  // Timeline Intelligence
  | "COLLAPSE_PHASE"
  | "ASSAULT_PHASE"
  | "STRANGLE_PHASE"
  | "DEATH_OVER_DRAMA";
  
export type Highlight = {
  id: string;
  type: HighlightType;
  event: BallEvent;
};

/*
================================================
IN-MEMORY HIGHLIGHT STORE
================================================
*/

const highlightCache: Record<string, Highlight[]> = {};

/*
================================================
ADD HIGHLIGHT
================================================
*/

export function addHighlight(matchId: string, highlight: Highlight) {

  if (!highlightCache[matchId]) {
    highlightCache[matchId] = [];
  }

  highlightCache[matchId].push(highlight);

  // notify listeners
  listeners.forEach((l) => l(matchId));
}
/*
================================================
GET HIGHLIGHTS
================================================
*/

export function getHighlights(
  matchId: string
): Highlight[] {
  return highlightCache[matchId] ?? [];
}

/*
================================================
CLEAR HIGHLIGHTS (useful for replay reset)
================================================
*/

export function clearHighlights(matchId: string) {
  highlightCache[matchId] = [];
}

export function subscribeHighlights(cb: HighlightListener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}