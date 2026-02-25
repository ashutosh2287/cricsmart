// highlightStore.ts

import { BallEvent } from "@/types/ballEvent";

export type Highlight = {
  id: string;
  type: "WICKET" | "SIX" | "BOUNDARY_CLUSTER" | "MOMENTUM_SPIKE";
  event: BallEvent;
};

const highlightCache: Record<string, Highlight[]> = {};

export function addHighlight(matchId: string, highlight: Highlight) {

  if (!highlightCache[matchId]) {
    highlightCache[matchId] = [];
  }

  highlightCache[matchId].push(highlight);
}

export function getHighlights(matchId: string): Highlight[] {
  return highlightCache[matchId] ?? [];
}