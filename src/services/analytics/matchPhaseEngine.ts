import { getEventStream } from "../matchEngine";
import { computeCurrentPartnership } from "./partnershipEngine";

export type MatchPhase =
  | "POWERPLAY_ASSAULT"
  | "POWERPLAY_CONTROL"
  | "MIDDLE_OVERS_BUILD"
  | "BOWLING_DOMINANCE"
  | "DEATH_OVERS_ATTACK"
  | "DEATH_OVERS_PRESSURE"
  | "COLLAPSE_PHASE";

export type MatchPhaseState = {
  phase: MatchPhase;
  over: number;
  runRate: number;
};

export type PhaseSegment = {
  phase: MatchPhase;
  startBall: number;
  endBall: number;
};

const phaseStore: Record<string, MatchPhaseState> = {};
const phaseTimelineStore: Record<string, PhaseSegment[]> = {};

export function getMatchPhase(matchId: string) {
  return phaseStore[matchId];
}

export function getMatchPhaseTimeline(matchId: string) {
  return phaseTimelineStore[matchId] ?? [];
}

export function updateMatchPhase(matchId: string) {

  const events = getEventStream(matchId);
  if (!events.length) return;

  const last = events[events.length - 1];

  const validBalls = events.filter(e => e.valid && e.isLegalDelivery);

  const runs = validBalls.reduce((s, e) => s + (e.runs ?? 0), 0);
  const balls = validBalls.length;

  const runRate = balls > 0 ? (runs / balls) * 6 : 0;

  const over = last.over;

  const partnership = computeCurrentPartnership(matchId);

  let phase: MatchPhase;

  /*
  ========================================
  NORMAL PHASE DETECTION
  ========================================
  */

  if (over < 6) {

    if (runRate >= 8) {
      phase = "POWERPLAY_ASSAULT";
    } else {
      phase = "POWERPLAY_CONTROL";
    }

  }

  else if (over < 15) {

    if (runRate < 5) {
      phase = "BOWLING_DOMINANCE";
    }
    else if (partnership && partnership.runs >= 50) {
      phase = "MIDDLE_OVERS_BUILD";
    }
    else {
      phase = "MIDDLE_OVERS_BUILD";
    }

  }

  else {

    if (runRate >= 9) {
      phase = "DEATH_OVERS_ATTACK";
    } else {
      phase = "DEATH_OVERS_PRESSURE";
    }

  }

  /*
  ========================================
  COLLAPSE DETECTION (OVERRIDE)
  ========================================
  */

  if (events.length >= 6) {

    const last6 = events.slice(-6);
    const wickets = last6.filter(e => e.wicket).length;

    if (wickets >= 2) {
      phase = "COLLAPSE_PHASE";
    }

  }

  /*
  ========================================
  STORE CURRENT PHASE
  ========================================
  */

  phaseStore[matchId] = {
    phase,
    over,
    runRate
  };

  /*
  ========================================
  BUILD PHASE TIMELINE
  ========================================
  */

  const ballIndex = validBalls.length - 1;

  if (!phaseTimelineStore[matchId]) {
    phaseTimelineStore[matchId] = [];
  }

  const timeline = phaseTimelineStore[matchId];
  const lastSegment = timeline[timeline.length - 1];

  if (!lastSegment) {

    timeline.push({
      phase,
      startBall: ballIndex,
      endBall: ballIndex
    });

  } else if (lastSegment.phase === phase) {

    lastSegment.endBall = ballIndex;

  } else {

    timeline.push({
      phase,
      startBall: ballIndex,
      endBall: ballIndex
    });

  }

}