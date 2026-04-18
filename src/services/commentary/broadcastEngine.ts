import type { BallEvent } from "@/types/ballEvent";

type OverMemory = {
  runs: number;
  wickets: number;
  balls: number;
};

type NarrativeState = {
  lastEvent?: string;
  consecutiveBoundaries: number;
  lastWasWicket: boolean;
};

const narrativeStore: Record<string, NarrativeState> = {};
const overTracker: Record<string, OverMemory> = {};

export function trackOver(event: BallEvent, matchId: string) {
  if (!overTracker[matchId]) {
    overTracker[matchId] = { runs: 0, wickets: 0, balls: 0 };
  }

  const over = overTracker[matchId];

  over.runs += event.totalRuns ?? event.runs ?? 0;
  if (event.isLegalDelivery) {
    over.balls += 1;
  }

  if (event.wicket) {
    over.wickets += 1;
  }

  if (over.balls === 6) {
    const summary = generateOverSummary(over);
    overTracker[matchId] = { runs: 0, wickets: 0, balls: 0 };
    return summary;
  }

  return null;
}

function generateOverSummary(over: OverMemory): string {
  const { runs, wickets } = over;

  if (runs >= 15) {
    return `Big over! ${runs} runs come from it.`;
  }

  if (runs <= 3) {
    return `Excellent over, just ${runs} runs conceded.`;
  }

  if (wickets > 0) {
    return `${runs} runs and ${wickets} wicket${wickets > 1 ? "s" : ""} in the over.`;
  }

  return `${runs} runs from the over.`;
}

export function updateNarrative(event: BallEvent, matchId: string): string | null {
  if (!narrativeStore[matchId]) {
    narrativeStore[matchId] = {
      consecutiveBoundaries: 0,
      lastWasWicket: false,
    };
  }

  const state = narrativeStore[matchId];
  const isBoundary =
    event.type === "FOUR" ||
    event.type === "SIX" ||
    event.runs === 4 ||
    event.runs === 6;

  if (isBoundary) {
    state.consecutiveBoundaries += 1;
  } else {
    state.consecutiveBoundaries = 0;
  }

  if (event.wicket && state.lastWasWicket) {
    state.lastWasWicket = true;
    return "Back-to-back wickets! This is turning dramatically!";
  }

  state.lastWasWicket = !!event.wicket;

  if (state.consecutiveBoundaries === 2) {
    return "Two boundaries in a row!";
  }

  if (state.consecutiveBoundaries === 3) {
    return "Three in a row! This is turning into a blitz!";
  }

  return null;
}