import type { BallEvent } from "@/types/ballEvent";
import { getMatchState, getEventStream } from "@/services/matchEngine";
import { computeChasePressure } from "@/services/pressureEngine";
import { computeMomentumContext } from "@/services/momentumContextEngine";
import { computeCurrentPartnership } from "@/services/analytics/partnershipEngine";
import type {
  CommentaryContext,
  CommentaryMomentumState,
  CommentaryPhase,
  CommentaryPressureLevel,
} from "./commentaryContextTypes";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function detectPhase(over: number, ballsRemaining: number, requiredRuns: number): CommentaryPhase {
  if (over >= 20) return "superOver";
  if (over < 6) return "powerplay";
  if (ballsRemaining <= 12 && requiredRuns > 0) return "chaseClimax";
  if (over >= 15) return "deathOvers";
  return "middleOvers";
}

function toPressureLevel(pressureIndex: number): CommentaryPressureLevel {
  if (pressureIndex >= 75) return "extreme";
  if (pressureIndex >= 50) return "high";
  if (pressureIndex >= 25) return "medium";
  return "low";
}

function toMomentumState(score: number, wickets: number, dots: number): CommentaryMomentumState {
  if (score > 30) return "surging";
  if (score < -30 || wickets >= 2) return "collapsing";
  if (dots >= 4) return "stalling";
  return "stable";
}

function getBatterRecentRuns(events: BallEvent[], batter: string, size: number): number[] {
  return events
    .filter((event) => event.valid && event.batsman === batter)
    .slice(-size)
    .map((event) => event.runs ?? 0);
}

function computeBowlerDominance(events: BallEvent[], bowler: string): number {
  const byBowler = events.filter((event) => event.valid && event.bowler === bowler).slice(-12);
  if (!byBowler.length) return 0;

  const dotBalls = byBowler.filter((event) => event.isLegalDelivery && (event.runs ?? 0) === 0).length;
  const wickets = byBowler.filter((event) => event.wicket).length;
  const conceded = byBowler.reduce((sum, event) => sum + (event.runs ?? 0), 0);

  return clamp((dotBalls * 6 + wickets * 20 - conceded * 1.2) / 40, 0, 1);
}

function getNarrativeText(value: number, high: string, low: string, neutral: string): string {
  if (value >= 0.65) return high;
  if (value <= 0.35) return low;
  return neutral;
}

export function buildCommentaryContext(
  matchId: string,
  branchId: string,
  event: BallEvent,
): CommentaryContext | null {
  const matchState = getMatchState(matchId);
  if (!matchState) return null;

  const inningsIndex = matchState.currentInningsIndex;
  const inningsState = matchState.innings[inningsIndex];
  if (!inningsState) return null;

  const events = getEventStream(matchId).filter(
    (item) => item.valid && (!item.branchId || item.branchId === branchId),
  );
  const legalEvents = events.filter((item) => item.isLegalDelivery);
  const recentLegal = legalEvents.slice(-6);

  const chase = computeChasePressure(matchState);
  const momentum = computeMomentumContext(events);
  const partnership = computeCurrentPartnership(matchId);

  const currentScore = inningsState.runs ?? 0;
  const wickets = inningsState.wickets ?? 0;
  const target =
    chase?.target ??
    (inningsIndex >= 1 ? (matchState.innings[0]?.runs ?? 0) + 1 : null);
  const requiredRunRate = chase?.requiredRunRate ?? 0;
  const ballsBowled = inningsState.over * 6 + inningsState.ball;
  const currentRunRate =
    chase?.currentRunRate ??
    (ballsBowled > 0 ? (currentScore / ballsBowled) * 6 : 0);

  const ballsRemaining =
    chase?.ballsRemaining ??
    Math.max(0, (matchState.configOvers ?? 20) * 6 - ballsBowled);
  const requiredRuns = target ? Math.max(0, target - currentScore) : 0;

  const recentRuns = recentLegal.reduce((sum, item) => sum + (item.runs ?? 0), 0);
  const recentWickets = recentLegal.filter((item) => item.wicket).length;
  const recentDots = recentLegal.filter((item) => (item.runs ?? 0) === 0).length;
  const recentBoundaries = recentLegal.filter((item) => (item.runs ?? 0) === 4 || (item.runs ?? 0) === 6).length;

  const pressureIndex = chase?.pressureIndex ?? clamp(requiredRunRate * 4 + wickets * 2, 0, 100);
  const pressureLevel = toPressureLevel(pressureIndex);
  const requiredAcceleration = clamp(requiredRunRate - currentRunRate, 0, 50);
  const chaseDifficulty = clamp((requiredRunRate / Math.max(currentRunRate, 0.1)) / 2, 0, 3);
  const clutchIndex = clamp((requiredAcceleration * 12 + (ballsRemaining <= 12 ? 35 : 0) + recentWickets * 10), 0, 100);

  const scoringTrend = clamp((recentRuns / Math.max(recentLegal.length, 1)) * 6 - currentRunRate, -20, 20);
  const battingControl = clamp((momentum.score + 100) / 200, 0, 1);
  const momentumState = toMomentumState(momentum.score, recentWickets, recentDots);

  const partnershipRuns = partnership?.runs ?? 0;
  const partnershipStrength = clamp(partnershipRuns / 100, 0, 1);
  const rebuildStatus: CommentaryContext["rebuildStatus"] =
    wickets >= 4 && partnershipRuns < 25 ? "rebuilding" : partnershipRuns >= 40 ? "rebuilt" : "none";
  const accelerationStatus: CommentaryContext["accelerationStatus"] =
    recentRuns >= 12 || recentBoundaries >= 2
      ? "accelerating"
      : recentRuns >= 8
        ? "building"
        : "none";

  const wicketClusterRisk = clamp(recentWickets / 3, 0, 1);
  const battingFragility = clamp(wickets / 10, 0, 1);
  const collapseRisk = clamp(wicketClusterRisk * 0.65 + battingFragility * 0.35, 0, 1);

  const batterRunsLast6 = getBatterRecentRuns(events, event.batsman, 6);
  const batterRunsPrev6 = getBatterRecentRuns(events, event.batsman, 12).slice(0, 6);
  const batterRecentAverage = batterRunsLast6.length
    ? batterRunsLast6.reduce((sum, run) => sum + run, 0) / batterRunsLast6.length
    : 0;
  const batterPrevAverage = batterRunsPrev6.length
    ? batterRunsPrev6.reduce((sum, run) => sum + run, 0) / batterRunsPrev6.length
    : 0;

  const batterForm = clamp(batterRecentAverage / 6, 0, 1);
  const strikeRateTrend = clamp((batterRecentAverage - batterPrevAverage) * 15, -100, 100);
  const boundaryPressure = clamp(requiredAcceleration / 4 + (recentBoundaries === 0 ? 0.25 : 0), 0, 1);
  const bowlerDominance = computeBowlerDominance(events, event.bowler);
  const matchupPressure = clamp(bowlerDominance * 0.6 + boundaryPressure * 0.4, 0, 1);

  const phaseOfMatch = detectPhase(inningsState.over, ballsRemaining, requiredRuns);

  const inningsNarrative = getNarrativeText(
    collapseRisk,
    "collapse underway",
    "dominant batting phase",
    "balanced innings",
  );

  const partnershipNarrative =
    partnershipRuns >= 50
      ? "partnership building strongly"
      : partnershipRuns >= 25
        ? "partnership stabilizing innings"
        : "new partnership under assessment";

  const chaseNarrative = target
    ? getNarrativeText(
        clamp((requiredRunRate - currentRunRate + 12) / 24, 0, 1),
        "pressure mounting in chase",
        "chase under control",
        "chase finely balanced",
      )
    : "setting innings foundation";

  const momentumNarrative =
    momentumState === "surging"
      ? "batting acceleration underway"
      : momentumState === "collapsing"
        ? "momentum reversal to bowling side"
        : momentumState === "stalling"
          ? "run flow has stalled"
          : "momentum stable";

  return {
    matchId,
    branchId,
    eventId: event.id,
    source: event.eventSource ?? "MANUAL",
    innings: inningsIndex + 1,
    over: inningsState.over,
    ball: inningsState.ball,
    phaseOfMatch,
    currentScore,
    wickets,
    target,
    requiredRunRate,
    currentRunRate,
    partnershipRuns,
    recentBoundaries,
    pressureLevel,
    chaseDifficulty,
    clutchIndex,
    requiredAcceleration,
    momentumState,
    momentumScore: momentum.score,
    recentRuns,
    recentWickets,
    scoringTrend,
    battingControl,
    partnershipStrength,
    rebuildStatus,
    accelerationStatus,
    collapseRisk,
    wicketClusterRisk,
    battingFragility,
    batterForm,
    strikeRateTrend,
    boundaryPressure,
    bowlerDominance,
    matchupPressure,
    inningsNarrative,
    partnershipNarrative,
    chaseNarrative,
    momentumNarrative,
  };
}