import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";
import type {
  CommentaryContextSignals,
  CommentaryEventCategory,
  CommentaryMode,
} from "@/types/commentary";
import { computeChasePressure } from "@/services/pressureEngine";
import { computeMomentumContext } from "@/services/momentumContextEngine";
import { getNarrativeState } from "@/services/narrative/narrativeEngine";

export type CommentaryContextInput = {
  matchId: string;
  branchId: string;
  mode: CommentaryMode;
  event: BallEvent;
  state: MatchState;
  events: BallEvent[];
};

export type CommentaryContextSnapshot = {
  matchId: string;
  branchId: string;
  eventId: string;
  timestamp: number;
  mode: CommentaryMode;
  context: CommentaryContextSignals;
};

const MAX_SNAPSHOTS_PER_MATCH = 500;
const contextSnapshotStore: Record<string, CommentaryContextSnapshot[]> = {};

function flattenInningsEvents(overs: MatchState["innings"][number]["overs"]) {
  return Object.keys(overs)
    .map(Number)
    .filter((overNumber) => Number.isFinite(overNumber))
    .sort((a, b) => a - b)
    .flatMap((overNumber) => overs[overNumber] ?? []);
}

function getCurrentPartnershipRuns(state: MatchState): number {
  const innings = state.innings[state.currentInningsIndex];
  if (!innings?.overs) return 0;
  const events = flattenInningsEvents(innings.overs);
  let runsSinceLastWicket = 0;

  for (const ball of events) {
    if (!ball?.valid) continue;
    if (ball.wicket) {
      runsSinceLastWicket = 0;
      continue;
    }
    runsSinceLastWicket += ball.runs ?? 0;
  }

  return runsSinceLastWicket;
}

function getRecentBoundaries(events: BallEvent[]): number {
  return events
    .filter((e) => e.isLegalDelivery)
    .slice(-12)
    .filter((e) => e.runs === 4 || e.runs === 6).length;
}

function getBatterForm(events: BallEvent[], batter: string): "cold" | "set" | "hot" {
  const recent = events
    .filter((e) => e.isLegalDelivery && e.batsman === batter)
    .slice(-10);

  const runs = recent.reduce((sum, e) => sum + (e.runs ?? 0), 0);
  if (runs >= 18) return "hot";
  if (runs >= 8) return "set";
  return "cold";
}

function getBowlerDominance(events: BallEvent[], bowler: string): "low" | "medium" | "high" {
  const recent = events
    .filter((e) => e.isLegalDelivery && e.bowler === bowler)
    .slice(-12);
  if (recent.length === 0) return "low";
  const dots = recent.filter((e) => e.runs === 0).length;
  const wickets = recent.filter((e) => e.wicket).length;
  const score = dots + wickets * 3;
  if (score >= 8) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function getSituationSignals(input: {
  event: BallEvent;
  partnershipRuns: number;
  pressureIndex: number;
  momentumState: CommentaryContextSignals["momentumState"];
  collapseRisk: CommentaryContextSignals["collapseRisk"];
}): CommentaryEventCategory[] {
  const { event, partnershipRuns, pressureIndex, momentumState, collapseRisk } = input;
  const categories = new Set<CommentaryEventCategory>();

  categories.add("delivery");
  if (event.runs === 4 || event.runs === 6) categories.add("boundary");
  if (event.wicket) categories.add("wicket");
  if (partnershipRuns >= 30) categories.add("partnership");
  if (collapseRisk === "high") categories.add("collapse");
  if (pressureIndex >= 55) categories.add("pressure");
  if (momentumState === "surge" || momentumState === "collapse") {
    categories.add("momentum_swing");
  }

  return Array.from(categories);
}

function getChaseDifficulty(pressureIndex: number, hasChase: boolean) {
  if (!hasChase) return "none" as const;
  if (pressureIndex >= 75) return "extreme" as const;
  if (pressureIndex >= 55) return "hard" as const;
  return "manageable" as const;
}

function getPressureState(pressureIndex: number) {
  if (pressureIndex >= 70) return "high" as const;
  if (pressureIndex >= 35) return "moderate" as const;
  return "low" as const;
}

function getCollapseRisk(input: {
  wickets: number;
  momentumState: CommentaryContextSignals["momentumState"];
  pressureIndex: number;
}) {
  if (
    input.wickets >= 7 ||
    (input.wickets >= 5 && input.momentumState === "collapse") ||
    input.pressureIndex >= 75
  ) {
    return "high" as const;
  }
  if (input.wickets >= 4 || input.pressureIndex >= 50) {
    return "watch" as const;
  }
  return "none" as const;
}

export function buildCommentaryContext(input: CommentaryContextInput): CommentaryContextSignals {
  const { matchId, branchId, state, event, events, mode } = input;
  const chase = computeChasePressure(state);
  const momentum = computeMomentumContext(events);
  const innings = state.innings[state.currentInningsIndex];
  const wickets = innings?.wickets ?? 0;

  const pressureIndex = chase?.pressureIndex ?? 0;
  const momentumState =
    momentum.arc === "SURGE"
      ? "surge"
      : momentum.arc === "STALL"
        ? "stall"
        : momentum.arc === "COLLAPSE"
          ? "collapse"
          : "neutral";

  const partnershipRuns = getCurrentPartnershipRuns(state);
  const collapseRisk = getCollapseRisk({ wickets, momentumState, pressureIndex });
  const narrative = getNarrativeState(matchId, branchId);

  const context: CommentaryContextSignals = {
    pressureIndex,
    pressureState: getPressureState(pressureIndex),
    momentumScore: momentum.score,
    momentumState,
    partnershipRuns,
    chaseDifficulty: getChaseDifficulty(pressureIndex, !!chase),
    recentBoundaries: getRecentBoundaries(events),
    collapseRisk,
    batterForm: getBatterForm(events, event.batsman),
    bowlerDominance: getBowlerDominance(events, event.bowler),
    narrativeState: narrative?.currentArc ?? "NORMAL",
    situationSignals: [],
  };

  context.situationSignals = getSituationSignals({
    event,
    partnershipRuns,
    pressureIndex,
    momentumState,
    collapseRisk,
  });

  const snapshot: CommentaryContextSnapshot = {
    matchId,
    branchId,
    eventId: event.id,
    timestamp: event.timestamp ?? Date.now(),
    mode,
    context,
  };

  if (!contextSnapshotStore[matchId]) {
    contextSnapshotStore[matchId] = [];
  }

  contextSnapshotStore[matchId].push(snapshot);
  if (contextSnapshotStore[matchId].length > MAX_SNAPSHOTS_PER_MATCH) {
    contextSnapshotStore[matchId].shift();
  }

  return context;
}

export function getCommentaryContextSnapshots(matchId: string) {
  return contextSnapshotStore[matchId] ?? [];
}

export function resetCommentaryContextSnapshots(matchId: string) {
  delete contextSnapshotStore[matchId];
}
