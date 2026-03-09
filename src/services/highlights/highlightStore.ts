// highlightStore.ts

import { BallEvent } from "@/types/ballEvent";

/*
================================================
HIGHLIGHT TYPES
================================================
*/

export type HighlightType =
  | "WICKET"
  | "SIX"
  | "BOUNDARY_CLUSTER"
  | "MOMENTUM_SPIKE"
  | "HAT_TRICK_THREAT"
  | "LAST_OVER_THRILLER"
  | "BIG_PARTNERSHIP"
  | "DOMINANT_PARTNERSHIP"
  | "TURNING_POINT";

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

export function addHighlight(
  matchId: string,
  highlight: Highlight
) {

  if (!highlightCache[matchId]) {
    highlightCache[matchId] = [];
  }

  highlightCache[matchId].push(highlight);
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