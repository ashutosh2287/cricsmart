import { BallEvent } from "@/types/ballEvent";
import { pushToTimeline } from "./broadcastTimeline";
import { getMatchConfig } from "./matchFormat";
import { advanceClock } from "./timeEngine";
import { processMatchIntelligence } from "./matchIntelligenceEngine";
import { v4 as uuidv4 } from "uuid";
import { generateAdvancedCommentary } from "./commentary/advancedCommentaryEngine";
import { emitCommentary } from "@/services/commentary/commentaryBus";
import { emitCommand } from "./commandBus";
import { setMatchState } from "@/persistence/eventStore/eventStore";

export type CorrectionEvent =
  | { type: "CORRECTION_UNDO_LAST" }
  | { type: "CORRECTION_DELETE"; targetEventId: string }
  | {
      type: "CORRECTION_REPLACE";
      targetEventId: string;
      replacement: Partial<BallEvent>;
    };

type PlayerFields = {
  batsman: string;
  nonStriker: string;
  bowler: string;
  battingTeam: string;
  bowlingTeam: string;
};

export type ScoringEvent =
  | ({ type: "RUN"; runs?: number } & PlayerFields)
  | ({ type: "FOUR" } & PlayerFields)
  | ({ type: "SIX" } & PlayerFields)
  | ({ type: "WICKET" } & PlayerFields)
  | ({ type: "WD" } & PlayerFields)
  | ({ type: "NB" } & PlayerFields)
  | ({ type: "BYE"; runs: number } & PlayerFields)
  | ({ type: "LB"; runs: number } & PlayerFields);

type BaseEvent = {
  id?: string;
};

export type EngineBallEvent =
  | (BaseEvent & { type: "RUN"; runs: number } & PlayerFields)
  | (BaseEvent & { type: "FOUR" } & PlayerFields)
  | (BaseEvent & { type: "SIX" } & PlayerFields)
  | (BaseEvent & { type: "WICKET" } & PlayerFields)
  | (BaseEvent & { type: "WD" } & PlayerFields)
  | (BaseEvent & { type: "NB" } & PlayerFields)
  | (BaseEvent & { type: "BYE"; runs: number } & PlayerFields)
  | (BaseEvent & { type: "LB"; runs: number } & PlayerFields)
  | (BaseEvent & { type: "CORRECTION_UNDO_LAST" })
  | (BaseEvent & { type: "CORRECTION_DELETE"; targetEventId: string })
  | (BaseEvent & {
      type: "CORRECTION_REPLACE";
      targetEventId: string;
      replacement: EngineBallEvent;
    });

export type InningsState = {
  runs: number;
  wickets: number;
  over: number;
  ball: number;
  overs: Record<number, BallEvent[]>;
  battingTeam?: string;
  bowlingTeam?: string;
  completed: boolean;
  striker?: string;
  nonStriker?: string;
  lastDismissedBatsman?: string;
  currentBowler?: string;
  bowlingStats?: Record<string, { balls: number; runs: number; wickets: number }>;
};

export type MatchState = {
  matchId: string;
  format: "T20" | "ODI" | "TEST";
  configOvers: number | null;
  innings: InningsState[];
  currentInningsIndex: number;
  activeBranchId: string;
  branches: string[];
  teamA: {
    name: string;
    squad: { name: string; role: string }[];
  };
  teamB: {
    name: string;
    squad: { name: string; role: string }[];
  };
  tossWinner: string;
  decision: "BAT" | "BOWL";
  matchEnded: boolean;
  winner: string | null;
  winBy: string | null;
};

const matches = new Map<string, MatchState>();
const eventStreams: Record<string, BallEvent[]> = {};
const matchListeners: Record<string, Set<(state: MatchState) => void>> = {};
const snapshotMap: Record<string, Record<string, MatchState>> = {};
export const temporalIndex: Record<
  string,
  { index: number; innings: number; over: number }[]
> = {};

function cloneState(state: MatchState): MatchState {
  return {
    ...state,
    innings: state.innings.map((innings) => ({
      ...innings,
      overs: Object.fromEntries(
        Object.entries(innings.overs).map(([over, balls]) => [Number(over), [...balls]])
      ),
      bowlingStats: innings.bowlingStats
        ? Object.fromEntries(
            Object.entries(innings.bowlingStats).map(([bowler, stats]) => [
              bowler,
              { ...stats },
            ])
          )
        : {},
    })),
    branches: [...state.branches],
    teamA: {
      ...state.teamA,
      squad: state.teamA.squad.map((player) => ({ ...player })),
    },
    teamB: {
      ...state.teamB,
      squad: state.teamB.squad.map((player) => ({ ...player })),
    },
  };
}

function createInningsState(battingTeam = "", bowlingTeam = ""): InningsState {
  return {
    runs: 0,
    wickets: 0,
    over: 0,
    ball: 0,
    overs: {},
    completed: false,
    striker: "",
    nonStriker: "",
    lastDismissedBatsman: "",
    battingTeam,
    bowlingTeam,
    bowlingStats: {},
  };
}

function saveSnapshot(
  matchId: string,
  inningsIndex: number,
  over: number,
  state: MatchState
) {
  if (!snapshotMap[matchId]) snapshotMap[matchId] = {};
  const key = `${inningsIndex}-${over}`;
  snapshotMap[matchId][key] = cloneState(state);

  if (!temporalIndex[matchId]) temporalIndex[matchId] = [];
  temporalIndex[matchId].push({
    index: eventStreams[matchId]?.length ?? 0,
    innings: inningsIndex,
    over,
  });
}

function emit(matchId: string) {
  const state = matches.get(matchId);
  if (!state) return;
  matchListeners[matchId]?.forEach((listener) => listener(state));
}

function getInitialBattingBowlingTeams(state: MatchState): {
  battingTeam: string;
  bowlingTeam: string;
} {
  const teamA = state.teamA?.name ?? "Team A";
  const teamB = state.teamB?.name ?? "Team B";

  if (!state.tossWinner) {
    return { battingTeam: teamA, bowlingTeam: teamB };
  }

  if (state.decision === "BAT") {
    return state.tossWinner === teamA
      ? { battingTeam: teamA, bowlingTeam: teamB }
      : { battingTeam: teamB, bowlingTeam: teamA };
  }

  return state.tossWinner === teamA
    ? { battingTeam: teamB, bowlingTeam: teamA }
    : { battingTeam: teamA, bowlingTeam: teamB };
}

function ensureFirstInningsTeams(next: MatchState) {
  const first = next.innings[0];
  if (!first) return;

  if (!first.battingTeam || !first.bowlingTeam) {
    const initial = getInitialBattingBowlingTeams(next);
    first.battingTeam = initial.battingTeam;
    first.bowlingTeam = initial.bowlingTeam;
  }
}

function ensureSecondInningsFromFirst(next: MatchState) {
  ensureFirstInningsTeams(next);

  const first = next.innings[0];
  if (!first?.battingTeam || !first?.bowlingTeam) return;

  const expectedBatting = first.bowlingTeam;
  const expectedBowling = first.battingTeam;

  if (!next.innings[1]) {
    next.innings.push(createInningsState(expectedBatting, expectedBowling));
    return;
  }

  next.innings[1].battingTeam = expectedBatting;
  next.innings[1].bowlingTeam = expectedBowling;
}

function completeCurrentInnings(next: MatchState) {
  const inningsIndex = next.currentInningsIndex;
  const innings = next.innings[inningsIndex];
  if (!innings) return;

  innings.completed = true;

  if (inningsIndex === 0) {
    ensureSecondInningsFromFirst(next);
    next.currentInningsIndex = 1;
  } else {
    next.matchEnded = true;
  }
}

function getTeamByName(
  next: MatchState,
  teamName?: string
): MatchState["teamA"] | MatchState["teamB"] | null {
  if (!teamName) return null;
  if (next.teamA?.name === teamName) return next.teamA;
  if (next.teamB?.name === teamName) return next.teamB;
  return null;
}

function getSquadNames(team?: { squad: { name: string; role: string }[] }) {
  return new Set((team?.squad ?? []).map((player) => player.name));
}

function ensureCurrentInningsTeams(
  next: MatchState,
  inningsIndex: number,
  event: ScoringEventWithId
) {
  const innings = next.innings[inningsIndex];
  if (!innings) return;

  if (!innings.battingTeam && !innings.bowlingTeam) {
    innings.battingTeam = event.battingTeam;
    innings.bowlingTeam = event.bowlingTeam;
    return;
  }

  if (!innings.battingTeam || !innings.bowlingTeam) {
    throw new Error(`❌ Incomplete innings team state in innings ${inningsIndex}`);
  }
}

function validatePlayersForInnings(
  next: MatchState,
  innings: InningsState,
  event: ScoringEventWithId
) {
  const battingTeam = getTeamByName(next, innings.battingTeam);
  const bowlingTeam = getTeamByName(next, innings.bowlingTeam);

  if (!battingTeam || !bowlingTeam) return;

  const battingNames = getSquadNames(battingTeam);
  const bowlingNames = getSquadNames(bowlingTeam);

  if (battingTeam.squad.length > 0) {
    if (!battingNames.has(event.batsman)) {
      throw new Error(
        `❌ Invalid batsman ${event.batsman} for batting team ${innings.battingTeam}`
      );
    }
    if (!battingNames.has(event.nonStriker)) {
      throw new Error(
        `❌ Invalid non-striker ${event.nonStriker} for batting team ${innings.battingTeam}`
      );
    }
  }

  if (bowlingTeam.squad.length > 0 && !bowlingNames.has(event.bowler)) {
    throw new Error(
      `❌ Invalid bowler ${event.bowler} for bowling team ${innings.bowlingTeam}`
    );
  }
}

function createInvalidBallEvent(
  state: MatchState,
  inningsIndex: number,
  over: number
): BallEvent {
  return {
    id: "",
    slug: state.matchId,
    over,
    runs: 0,
    wicket: false,
    extra: false,
    type: "RUN",
    timestamp: Date.now(),
    isLegalDelivery: true,
    valid: false,
    branchId: state.activeBranchId,
    batsman: "",
    nonStriker: "",
    bowler: "",
    innings: inningsIndex,
    totalRuns: 0,
  };
}

function createBallEvent(
  state: MatchState,
  innings: InningsState,
  inningsIndex: number,
  event: ScoringEventWithId
): BallEvent {
  const common = {
    id: event.id ?? uuidv4(),
    slug: state.matchId,
    over: innings.over + innings.ball / 10,
    timestamp: Date.now(),
    valid: true,
    branchId: state.activeBranchId,
    batsman: event.batsman,
    nonStriker: event.nonStriker,
    bowler: event.bowler,
    innings: inningsIndex,
  };

  switch (event.type) {
    case "RUN":
      return {
        ...common,
        type: "RUN",
        runs: event.runs ?? 1,
        totalRuns: event.runs ?? 1,
        wicket: false,
        extra: false,
        isLegalDelivery: true,
      };

    case "FOUR":
      return {
        ...common,
        type: "FOUR",
        runs: 4,
        totalRuns: 4,
        wicket: false,
        extra: false,
        isLegalDelivery: true,
      };

    case "SIX":
      return {
        ...common,
        type: "SIX",
        runs: 6,
        totalRuns: 6,
        wicket: false,
        extra: false,
        isLegalDelivery: true,
      };

    case "WICKET":
      return {
        ...common,
        type: "WICKET",
        runs: 0,
        totalRuns: 0,
        wicket: true,
        extra: false,
        isLegalDelivery: true,
        dismissedBatsman: event.batsman,
        dismissalKind: "UNKNOWN",
      };

    case "WD":
      return {
        ...common,
        type: "WD",
        runs: 1,
        totalRuns: 1,
        wicket: false,
        extra: true,
        extraType: "WD",
        extraRuns: 1,
        isLegalDelivery: false,
      };

    case "NB":
      return {
        ...common,
        type: "NB",
        runs: 1,
        totalRuns: 1,
        wicket: false,
        extra: true,
        extraType: "NB",
        extraRuns: 1,
        isLegalDelivery: false,
      };

    case "BYE":
      return {
        ...common,
        type: "BYE",
        runs: event.runs ?? 0,
        totalRuns: event.runs ?? 0,
        wicket: false,
        extra: false,
        extraType: "BYE",
        extraRuns: event.runs ?? 0,
        isLegalDelivery: true,
      };

    case "LB":
      return {
        ...common,
        type: "LB",
        runs: event.runs ?? 0,
        totalRuns: event.runs ?? 0,
        wicket: false,
        extra: false,
        extraType: "LB",
        extraRuns: event.runs ?? 0,
        isLegalDelivery: true,
      };

    default:
      throw new Error(`❌ Unsupported scoring event ${(event as { type?: string }).type}`);
  }
}

export function initMatch(
  matchId: string,
  format: "T20" | "ODI" | "TEST" = "T20"
) {
  if (matches.has(matchId)) return;

  const config = getMatchConfig(format);

  matches.set(matchId, {
    matchId,
    format,
    configOvers: config.oversPerInnings,
    innings: [createInningsState(), createInningsState()],
    currentInningsIndex: 0,
    activeBranchId: "main",
    branches: ["main"],
    teamA: { name: "Team A", squad: [] },
    teamB: { name: "Team B", squad: [] },
    tossWinner: "",
    decision: "BAT",
    matchEnded: false,
    winner: null,
    winBy: null,
  });

  eventStreams[matchId] = [];
}

type ScoringEventWithId = ScoringEvent & { id?: string };

function reduce(
  state: MatchState,
  event: ScoringEventWithId
): { next: MatchState; ballEvent: BallEvent } {
  const next = cloneState(state);

  if (next.innings.length > 2) {
    next.innings = next.innings.slice(0, 2);
  }

  ensureFirstInningsTeams(next);

  const inningsIndex = next.currentInningsIndex;
  if (inningsIndex === 1) {
    ensureSecondInningsFromFirst(next);
  }

  const innings = next.innings[inningsIndex];
  if (!innings) {
    throw new Error(`❌ Missing innings state for innings ${inningsIndex}`);
  }

  ensureCurrentInningsTeams(next, inningsIndex, event);
  validatePlayersForInnings(next, innings, event);

  if (!innings.bowlingStats) innings.bowlingStats = {};

  const bowler = event.bowler;
  innings.currentBowler = bowler;

  if (!innings.bowlingStats[bowler]) {
    innings.bowlingStats[bowler] = { balls: 0, runs: 0, wickets: 0 };
  }

  const totalBalls = innings.over * 6 + innings.ball;

  if (next.configOvers !== null && totalBalls >= next.configOvers * 6) {
    completeCurrentInnings(next);
    return {
      next,
      ballEvent: createInvalidBallEvent(state, inningsIndex, innings.over),
    };
  }

  if (innings.completed) {
    return {
      next,
      ballEvent: createInvalidBallEvent(state, inningsIndex, innings.over),
    };
  }

  if (!innings.striker || !innings.nonStriker) {
    innings.striker = event.batsman;
    innings.nonStriker = event.nonStriker;
  }

  const ballEvent = createBallEvent(state, innings, inningsIndex, event);

  if (!innings.overs[innings.over]) innings.overs[innings.over] = [];

if (innings.overs[innings.over].length >= 6 && ballEvent.isLegalDelivery) {
  return {
    next,
    ballEvent: createInvalidBallEvent(state, inningsIndex, innings.over),
  };
}

innings.overs[innings.over].push(ballEvent);

  const stats = innings.bowlingStats[bowler];
  if (ballEvent.isLegalDelivery) {
    stats.balls++;
  }

  stats.runs += ballEvent.totalRuns;

  if (ballEvent.type === "WICKET") {
    stats.wickets++;
  }

  innings.runs += ballEvent.totalRuns;

  if (ballEvent.type === "WICKET") {
    innings.wickets++;
    innings.lastDismissedBatsman = ballEvent.dismissedBatsman;
  } else {
    innings.lastDismissedBatsman = "";
    innings.striker = ballEvent.batsman;
    innings.nonStriker = ballEvent.nonStriker;
  }

  if (ballEvent.type !== "WICKET" && ballEvent.totalRuns % 2 === 1) {
    const temp = innings.striker;
    innings.striker = innings.nonStriker;
    innings.nonStriker = temp;
  }

  if (ballEvent.isLegalDelivery) {
    innings.ball++;

    if (innings.ball === 6) {
      const completedOver = innings.over;

      if (ballEvent.type !== "WICKET") {
        const temp = innings.striker;
        innings.striker = innings.nonStriker;
        innings.nonStriker = temp;
      }

      innings.ball = 0;
      innings.over++;

      saveSnapshot(state.matchId, inningsIndex, completedOver, next);
    }
  }

  const updatedTotalBalls = innings.over * 6 + innings.ball;

  if (next.configOvers !== null && updatedTotalBalls >= next.configOvers * 6) {
    completeCurrentInnings(next);
  }

  if (innings.wickets >= 10) {
    completeCurrentInnings(next);
  }

  return { next, ballEvent };
}

export function dispatchBallEvent(matchId: string, event: EngineBallEvent) {
  let current = matches.get(matchId);

  if (current?.matchEnded) return;

  if (!current) {
    initMatch(matchId);
    current = matches.get(matchId)!;
  }

  const innings = current.innings[current.currentInningsIndex];
  if (innings?.completed) return;

  if (
    event.type === "CORRECTION_UNDO_LAST" ||
    event.type === "CORRECTION_DELETE" ||
    event.type === "CORRECTION_REPLACE"
  ) {
    return;
  }

  const eventId = event.id;
if (eventId && eventStreams[matchId]?.some((e) => e.id === eventId)) {
  return;
}

  const { next, ballEvent } = reduce(current, event);

  if (
    ballEvent.isLegalDelivery &&
    ballEvent.runs === 0 &&
    !ballEvent.wicket &&
    !ballEvent.extra
  ) {
    emitCommand({
      type: "DOT_BALL",
      slug: matchId,
    });
  }

  const commentaryText = generateAdvancedCommentary(ballEvent, next);

  emitCommentary({
    matchId,
    text: commentaryText,
    eventId: ballEvent.id,
    category: "BALL",
  });

  ballEvent.commentary = commentaryText;

  const freshState = cloneState(next);
  matches.set(matchId, freshState);

// 🔥 ADD THIS LINE (MOST IMPORTANT)
setMatchState(matchId, freshState);

  console.log("ENGINE INNINGS CHECK", {
    currentInningsIndex: freshState.currentInningsIndex,
    innings0: freshState.innings[0] && {
      battingTeam: freshState.innings[0].battingTeam,
      bowlingTeam: freshState.innings[0].bowlingTeam,
    },
    innings1: freshState.innings[1] && {
      battingTeam: freshState.innings[1].battingTeam,
      bowlingTeam: freshState.innings[1].bowlingTeam,
    },
  });

  if (ballEvent.valid) {
    eventStreams[matchId].push(ballEvent);
    pushToTimeline({
      ...ballEvent,
      commentary: commentaryText,
    });
  }

  advanceClock(matchId);

  processMatchIntelligence({
    matchId,
    branchId: freshState.activeBranchId,
    state: freshState,
    ballEvent,
  });

  emit(matchId);
  console.log("🔥 EMIT SENT:", {
  matchId,
  subscribers: matchListeners[matchId]?.size ?? 0,
  innings: freshState.innings[freshState.currentInningsIndex],
});
}

export function getMatchState(matchId: string) {
  const state = matches.get(matchId);

  console.log("📦 STATE FROM STORE:", state); // ✅ ADD HERE

  return state;
}
export function getEventStream(matchId: string) {
  return eventStreams[matchId] ?? [];
}

export function subscribeMatch(
  matchId: string,
  cb: (state: MatchState) => void
) {
  if (!matchListeners[matchId]) matchListeners[matchId] = new Set();
  matchListeners[matchId].add(cb);

  return () => {
    matchListeners[matchId].delete(cb);
  };
}

export function hydrateMatchState(matchId: string, state: MatchState) {
  const next = cloneState(state);

  ensureFirstInningsTeams(next);

  if (
    next.innings[1] &&
    next.innings[0]?.battingTeam &&
    next.innings[0]?.bowlingTeam
  ) {
    next.innings[1].battingTeam = next.innings[0].bowlingTeam;
    next.innings[1].bowlingTeam = next.innings[0].battingTeam;
  }

  matches.set(matchId, next);
  emit(matchId);
}

export function reduceStateOnly(state: MatchState, event: BallEvent): MatchState {
  const inningsIndex = event.innings ?? state.currentInningsIndex;
  const innings = state.innings[inningsIndex];
  const fallbackInitial = getInitialBattingBowlingTeams(state);

  const replayState = cloneState(state);
  replayState.currentInningsIndex = inningsIndex;

  if (inningsIndex === 1) {
    ensureSecondInningsFromFirst(replayState);
  }

  const resolvedBattingTeam =
    inningsIndex === 1 &&
    replayState.innings[0]?.battingTeam &&
    replayState.innings[0]?.bowlingTeam
      ? replayState.innings[0].bowlingTeam
      : innings?.battingTeam || fallbackInitial.battingTeam;

  const resolvedBowlingTeam =
    inningsIndex === 1 &&
    replayState.innings[0]?.battingTeam &&
    replayState.innings[0]?.bowlingTeam
      ? replayState.innings[0].battingTeam
      : innings?.bowlingTeam || fallbackInitial.bowlingTeam;

  const engineEvent = {
    id: event.id,
    type: event.type,
    runs: event.runs,
    batsman: event.batsman,
    nonStriker: event.nonStriker,
    bowler: event.bowler,
    battingTeam: resolvedBattingTeam,
    bowlingTeam: resolvedBowlingTeam,
  } as ScoringEventWithId;

  const { next } = reduce(replayState, engineEvent);
  return next;
}

export function setEventStream(matchId: string, events: BallEvent[]) {
  eventStreams[matchId] = [...events];
}

export function resetMatchState(matchId: string) {
  matches.delete(matchId);
  eventStreams[matchId] = [];
  delete matchListeners[matchId];
  delete snapshotMap[matchId];
  delete temporalIndex[matchId];
  initMatch(matchId);
}

export function getSnapshot(
  matchId: string,
  inningsIndex: number,
  over: number
): MatchState | undefined {
  const key = `${inningsIndex}-${over}`;
  return snapshotMap[matchId]?.[key];
}