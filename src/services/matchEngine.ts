import { BallEvent } from "@/types/ballEvent";
import { pushToTimeline } from "./broadcastTimeline";
import { getMatchConfig } from "./matchFormat";
import { advanceClock } from "./timeEngine";
import { processMatchIntelligence } from "./matchIntelligenceEngine";
import { v4 as uuidv4 } from "uuid";
import { generateAdvancedCommentary } from "./commentary/advancedCommentaryEngine";
import { emitCommentary } from "@/services/commentary/commentaryBus";
import { emitCommand } from "./commandBus";
import { setMatchState as setUIState } from "@/lib/eventStore";
import { addCommentary } from "@/services/commentary/commentaryStore";
import { setAnalytics } from "@/services/analytics/liveAnalyticsStore";
import { getMomentumTimeline } from "@/services/analytics/momentumTimelineEngine";
import { generateBroadcastInsights } from "./broadcast/broadcastInsightEngine";
import { processMomentumEvent } from "@/services/analytics/momentumTimelineEngine";
import { getAnalytics } from "@/services/analytics/liveAnalyticsStore";
import { getBroadcastInsights } from "./broadcast/broadcastInsightEngine";
import { getCommentary } from "@/services/commentary/commentaryStore";
import { clearPlayerRegistry } from "./player/playerRegistry";
import { updatePlayerRegistry } from "./playerRegistryEngine";
import { broadcast } from "@/services/realtime/eventBus";
import { appendEventTimeline, resetEventTimeline } from "@/services/replay/eventTimeline";
import { appendCommentaryTimeline, resetCommentaryTimeline } from "@/services/commentary/commentaryTimelineStore";
import { recordBallEvent } from "@/services/recording/eventRecorder";
import { predictWinProbabilityFromState } from "@/services/ml/prediction/winProbabilityPredictor";






type StorageModuleType = typeof import("@/services/storage/eventStorage");

let storageModule: StorageModuleType | null = null;

async function getStorageModule(): Promise<StorageModuleType> {
  if (!storageModule) {
    storageModule = await import("@/services/storage/eventStorage");
  }
  return storageModule;
}

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

type BattingRecord = {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
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
  over?: number;
  ball?: number;
  timestamp?: number;
  providerType?: string;
  providerTimestamp?: number;
  ingestionTimestamp?: number;
  eventSource?: "LIVE_INGESTION" | "MOCK_INGESTION" | "SIMULATION" | "REPLAY" | "MANUAL";
  replaySourceId?: string;
};

export type EngineBallEvent =
  | (BaseEvent & { type: "RUN"; runs: number } & PlayerFields)
  | (BaseEvent & {
    type: "WICKET";
    runs?: number;
    dismissalKind?: "BOWLED" | "CAUGHT" | "RUN_OUT_STRIKER" | "RUN_OUT_NON_STRIKER";
  } & PlayerFields)
| (BaseEvent & { type: "WD"; runs?: number } & PlayerFields)
| (BaseEvent & { type: "NB"; runs?: number } & PlayerFields)
| (BaseEvent & { type: "FOUR"; runs?: number } & PlayerFields)
| (BaseEvent & { type: "SIX"; runs?: number } & PlayerFields)
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
  battingRecords?: BattingRecord[];
  nextBatsmanIndex?: number;
  battingOrder?: string[];
};

export type MatchState = {
  matchId: string;
  format: "T20" | "ODI" | "TEST";
  configOvers: number | null;
  innings: InningsState[];
  currentInningsIndex: number;
  activeBranchId: string;
  branches: string[];
  commentary?: string[];
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
export type DispatchBallEventResult =
  | {
      ok: false;
      reason:
        | "MATCH_ENDED"
        | "INNINGS_COMPLETED"
        | "CORRECTION_EVENT_IGNORED"
        | "DUPLICATE_EVENT"
        | "INVALID_EVENT";
    }
  | {
      ok: true;
      matchId: string;
      state: MatchState;
      ballEvent: BallEvent;
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
  battingRecords: innings.battingRecords
    ? innings.battingRecords.map((record) => ({ ...record }))
    : [],
  striker: innings.striker ?? "",
  nonStriker: innings.nonStriker ?? "",
  lastDismissedBatsman: innings.lastDismissedBatsman ?? "",
  currentBowler: innings.currentBowler ?? "",
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
    currentBowler: "",
    bowlingStats: {},
    battingRecords: [],
     nextBatsmanIndex: 2,
     battingOrder: [],
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
  matchListeners[matchId]?.forEach((listener) => listener(cloneState(state)));
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
  const first = next.innings[0];
  if (!first?.battingTeam || !first?.bowlingTeam) return;

  const expectedBatting = first.bowlingTeam;
  const expectedBowling = first.battingTeam;

  if (!next.innings[1]) {
    next.innings[1] = createInningsState(expectedBatting, expectedBowling);
  } else {
    // 🔥 FORCE UPDATE (IMPORTANT FIX)
    next.innings[1].battingTeam = expectedBatting;
    next.innings[1].bowlingTeam = expectedBowling;
  }
}

function decideWinner(next: MatchState) {
  const first = next.innings[0];
  const second = next.innings[1];

  if (!first || !second) return;

  const teamA = next.teamA.name;
  const teamB = next.teamB.name;

  const firstRuns = first.runs;
  const secondRuns = second.runs;

  // 🟡 CASE 1: Tie
  if (firstRuns === secondRuns) {
    next.winner = "TIE";
    next.winBy = "Match tied";
    return;
  }

  // 🟢 CASE 2: Team batting second wins (chase successful)
  if (secondRuns > firstRuns) {
    const wicketsLeft = 10 - second.wickets;
    next.winner = second.battingTeam || "Unknown";
    next.winBy = `${wicketsLeft} wickets`;
    return;
  }

  // 🔵 CASE 3: Team batting first wins
  const runDiff = firstRuns - secondRuns;
  next.winner = first.battingTeam || "Unknown";
  next.winBy = `${runDiff} runs`;
}

function completeCurrentInnings(next: MatchState) {
  const inningsIndex = next.currentInningsIndex;
  const innings = next.innings[inningsIndex];
  if (!innings) return;

  innings.completed = true;

  if (inningsIndex === 0) {
    ensureSecondInningsFromFirst(next);
    next.currentInningsIndex = 1;
    const second = next.innings[1];
    if (second) {
      second.completed = false;
      second.runs = second.runs ?? 0;
      second.wickets = second.wickets ?? 0;
      second.over = second.over ?? 0;
      second.ball = second.ball ?? 0;
    }
    return;
  }

  next.matchEnded = true;
  decideWinner(next);
}

function checkChaseCompleted(next: MatchState) {
  if (next.currentInningsIndex !== 1) return;

  const first = next.innings[0];
  const second = next.innings[1];
  if (!first || !second || second.completed) return;

  const target = first.runs + 1;

  if (second.runs >= target) {
    second.completed = true;
    next.matchEnded = true;
    decideWinner(next);
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

  const engineStriker = innings.striker?.trim();
  const engineNonStriker = innings.nonStriker?.trim();
  const incomingBatsman = event.batsman?.trim();
  const incomingNonStriker = event.nonStriker?.trim();
  const incomingBowler = event.bowler?.trim();

  if (battingTeam.squad.length > 0) {
    if (engineStriker && !battingNames.has(engineStriker)) {
      throw new Error(
        `❌ Invalid engine striker ${engineStriker} for batting team ${innings.battingTeam}`
      );
    }

    if (engineNonStriker && !battingNames.has(engineNonStriker)) {
      throw new Error(
        `❌ Invalid engine non-striker ${engineNonStriker} for batting team ${innings.battingTeam}`
      );
    }

    // Engine owns the batting pair after bootstrap.
// Do not validate incoming batsman/non-striker here; they are adapter inputs only.
  }

  if (bowlingTeam.squad.length > 0 && incomingBowler && !bowlingNames.has(incomingBowler)) {
    throw new Error(
      `❌ Invalid bowler ${incomingBowler} for bowling team ${innings.bowlingTeam}`
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
  const striker = innings.striker?.trim() ?? "";
const nonStriker = innings.nonStriker?.trim() ?? "";
const bowler = innings.currentBowler?.trim() || event.bowler?.trim() || "";

if (!striker || !nonStriker) {
  throw new Error("❌ Missing striker/non-striker before ball event");
}

// fallback bowler (TEMP SAFE)
const finalBowler = bowler || "Unknown Bowler";

  const common = {
    id: event.id ?? uuidv4(),
    slug: state.matchId,
    over: innings.over + innings.ball / 10,
    timestamp: Date.now(),
    valid: true,
    branchId: state.activeBranchId,
    batsman: striker,
    nonStriker,
    bowler: finalBowler,
    innings: inningsIndex,
    providerType: event.providerType,
    providerTimestamp: event.providerTimestamp ?? event.timestamp,
    ingestionTimestamp: event.ingestionTimestamp ?? Date.now(),
    eventSource: event.eventSource,
    replaySourceId: event.replaySourceId,
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
        dismissedBatsman: striker,
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
    teamA: { name: "", squad: [] },
    teamB: { name: "", squad: [] },
    tossWinner: "",
    decision: "BAT",
    matchEnded: false,
    winner: null,
    winBy: null,
  });

  eventStreams[matchId] = [];
}

function assertValidActiveBatters(
  innings: InningsState,
  context: string,
  allowIncomplete = false
) {
  const striker = innings.striker?.trim() ?? "";
  const nonStriker = innings.nonStriker?.trim() ?? "";

  if (allowIncomplete) {
    if (!striker && !nonStriker) {
      return;
    }

    if (innings.completed || innings.wickets >= 10) {
      if (striker && nonStriker && striker !== nonStriker) {
        return;
      }
      return;
    }
  }

  if (!striker || !nonStriker) {
    throw new Error(`❌ ${context}: missing striker/non-striker`);
  }

  if (striker === nonStriker) {
    throw new Error(
      `❌ ${context}: striker and non-striker are the same player (${striker})`
    );
  }

  const activeCount = [striker, nonStriker].filter(Boolean).length;
  if (activeCount !== 2) {
    throw new Error(`❌ ${context}: expected exactly 2 active batsmen`);
  }
}

type ScoringEventWithId = ScoringEvent &
  Pick<
    BaseEvent,
    | "id"
    | "timestamp"
    | "providerType"
    | "providerTimestamp"
    | "ingestionTimestamp"
    | "eventSource"
    | "replaySourceId"
  >;

function reduce(
  state: MatchState,
  event: ScoringEventWithId
): { next: MatchState; ballEvent: BallEvent } {

  const bowlerName = event.bowler?.trim();

if (!bowlerName) {
  throw new Error("❌ Missing bowler in event");
}
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

  if (innings.completed) {
    return {
      next,
      ballEvent: createInvalidBallEvent(state, inningsIndex, innings.over),
    };
  }

  ensureCurrentInningsTeams(next, inningsIndex, event);

  if (!innings.bowlingStats) innings.bowlingStats = {};

  const totalBallsBefore = innings.over * 6 + innings.ball;
  if (next.configOvers !== null && totalBallsBefore >= next.configOvers * 6) {
    completeCurrentInnings(next);
    return {
      next,
      ballEvent: createInvalidBallEvent(state, inningsIndex, innings.over),
    };
  }

  innings.battingRecords ??= [];
const records = innings.battingRecords;

const ensureBattingRecord = (name?: string, required = false) => {
  const trimmed = name?.trim();

  if (!trimmed) {
    if (required) {
      throw new Error("❌ Cannot create batting record for empty player name");
    }
    return null;
  }

  let record = records.find((b) => b.name === trimmed);
  if (!record) {
    record = {
      name: trimmed,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
    };
    records.push(record);
  }
  return record;
};

const swapStrike = () => {
  const temp = innings.striker;
  innings.striker = innings.nonStriker;
  innings.nonStriker = temp;
};

function updateStrikeAfterBall(
  innings: InningsState,
  ballEvent: BallEvent,
  event: ScoringEventWithId
) {
  const runs = ballEvent.totalRuns ?? 0;

  const dismissalKind =
    "dismissalKind" in event ? event.dismissalKind : undefined;

  const isRunOut =
    event.type === "WICKET" &&
    typeof dismissalKind === "string" &&
    dismissalKind.includes("RUN_OUT");

  const isLegal = ballEvent.isLegalDelivery;

  // =======================
  // 🔁 STEP 1: RUN ROTATION
  // =======================

  if (isRunOut) {
    if (runs % 2 === 1) {
      swapStrike();
    }
  } else {
    if (isLegal && runs % 2 === 1) {
      swapStrike();
    }
  }

  // =======================
  // 🔁 STEP 2: OVER END SWAP
  // =======================

  if (isLegal && innings.ball === 6) {
    swapStrike();
  }
}


const engineStriker = innings.striker?.trim() ?? "";
const engineNonStriker = innings.nonStriker?.trim() ?? "";

// Bootstrap allowed only at innings start when engine has no active pair.
// ✅ ENGINE IS SOURCE OF TRUTH

if (!engineStriker && !engineNonStriker) {
  const team = getTeamByName(next, innings.battingTeam);

  const squad = innings.battingOrder?.length
    ? innings.battingOrder.map(name => ({ name }))
    : team?.squad ?? [];

  if (squad.length >= 2) {
    innings.striker = squad[0].name;
    innings.nonStriker = squad[1].name;
    innings.nextBatsmanIndex = 2;

  } else if (event.batsman && event.nonStriker) {
    console.warn("⚠️ Fallback: using event batsmen for bootstrap");

    innings.striker = event.batsman;
    innings.nonStriker = event.nonStriker;
    innings.nextBatsmanIndex = 2;

  } else {
    throw new Error("❌ Cannot initialize batting pair: insufficient squad");
  }

} else {
  if (!engineStriker || !engineNonStriker) {
    throw new Error("❌ Engine batting state corrupted");
  }

  // 🔥 OPTIONAL SYNC (SAFE)
  const apiBatsman = event.batsman?.trim();

  if (apiBatsman && apiBatsman !== engineStriker) {
    console.warn("⚠️ Striker correction:", apiBatsman);

    if (apiBatsman === engineNonStriker) {
      // swap
      const temp = innings.striker;
      innings.striker = innings.nonStriker;
      innings.nonStriker = temp;
    }
  }
}

assertValidActiveBatters(innings, "Pre-ball engine batting state");


// Bowler is event-driven; batting pair is engine-driven.
innings.currentBowler = bowlerName;

ensureBattingRecord(innings.striker, true);
ensureBattingRecord(innings.nonStriker, true);


if (!innings.bowlingStats[bowlerName]) {
  innings.bowlingStats[bowlerName] = { balls: 0, runs: 0, wickets: 0 };
}

const currentOver = innings.over;
if (!innings.overs[currentOver]) {
  innings.overs[currentOver] = [];
}


const ballEvent = createBallEvent(next, innings, inningsIndex, event);

console.log("🏏 BALL EVENT", {
  type: ballEvent.type,
  runs: ballEvent.totalRuns,
  over: innings.over,
  ball: innings.ball,
  striker: innings.striker,
  nonStriker: innings.nonStriker,
  wickets: innings.wickets,
  score: innings.runs,
});

innings.overs[currentOver].push(ballEvent);
// ✅ UPDATE BALL COUNT
if (ballEvent.isLegalDelivery) {
  innings.ball += 1;
}

const stats = innings.bowlingStats[bowlerName];
if (ballEvent.isLegalDelivery) {
  stats.balls += 1;
}
stats.runs += ballEvent.totalRuns;
if (ballEvent.type === "WICKET") {
  stats.wickets += 1;
}

const strikerRecord = ensureBattingRecord(innings.striker, true);

if (strikerRecord) {
  if (
    ballEvent.type === "RUN" ||
    ballEvent.type === "FOUR" ||
    ballEvent.type === "SIX"
  ) {
    strikerRecord.runs += ballEvent.runs ?? 0;
  }

  if (
    ballEvent.isLegalDelivery &&
    ballEvent.type !== "WD" &&
    ballEvent.type !== "NB"
  ) {
    strikerRecord.balls += 1;
  }

  if (ballEvent.type === "FOUR") {
    strikerRecord.fours += 1;
  }

  if (ballEvent.type === "SIX") {
    strikerRecord.sixes += 1;
  }
}

innings.runs += ballEvent.totalRuns;
console.log("📊 SCORE UPDATE", {
  score: innings.runs,
  wickets: innings.wickets,
  over: innings.over,
  ball: innings.ball,
});


// ❌ DO NOT update strike here (moved after wicket logic)

// =======================
// 🔁 STRIKE + WICKET LOGIC (FINAL)
// =======================

// helper must be OUTSIDE any if/else
// =======================
// 🔁 STRIKE + WICKET LOGIC
// =======================

const getNextBatsman = () => {
  const team = getTeamByName(next, innings.battingTeam);
  const squad = innings.battingOrder?.length
  ? innings.battingOrder.map((name) => ({ name }))
  : team?.squad ?? [];

  let index = innings.nextBatsmanIndex ?? 2;

  while (index < squad.length) {
    const candidate = squad[index]?.name?.trim() ?? "";

    const isActive =
      candidate === (innings.striker?.trim() ?? "") ||
      candidate === (innings.nonStriker?.trim() ?? "");

    if (candidate && !isActive) {
      innings.nextBatsmanIndex = index + 1;
      return candidate;
    }

    index++;
  }

  innings.nextBatsmanIndex = index;
  return null;
};

if (ballEvent.type === "WICKET") {
  innings.wickets += 1;
let dismissedBatsman = innings.striker?.trim();
let survivingBatter = innings.nonStriker?.trim();

// 🔥 RUN-OUT HANDLING
// 🔥 RUN-OUT HANDLING (CHECK ENGINE EVENT, NOT ballEvent)
const dismissalKind =
  "dismissalKind" in event ? event.dismissalKind : undefined;

if (
  event.type === "WICKET" &&
  dismissalKind === "RUN_OUT_NON_STRIKER"
) {
  dismissedBatsman = innings.nonStriker?.trim();
  survivingBatter = innings.striker?.trim();
}
  if (!dismissedBatsman) {
    throw new Error("❌ Wicket processing failed: missing current striker");
  }

  innings.lastDismissedBatsman = dismissedBatsman;

  const outRecord = ensureBattingRecord(dismissedBatsman, true);
  if (outRecord) {
    outRecord.isOut = true;
  }

  if (!survivingBatter) {
    throw new Error("❌ Wicket processing failed: missing surviving batter");
  }
const nextBatsman = getNextBatsman();

if (!nextBatsman) {
  innings.wickets = Math.max(innings.wickets, 10);
  innings.striker = "";
  innings.nonStriker = "";
  completeCurrentInnings(next);
  return { next, ballEvent };
}

// 🔥 DEFAULT: striker out → new batsman on strike
// ✅ New batsman replaces dismissed striker
innings.striker = nextBatsman;
innings.nonStriker = survivingBatter;

// ✅ If wicket fell on odd runs, rotate strike
if ((ballEvent.totalRuns ?? 0) % 2 === 1) {
  const temp = innings.striker;
  innings.striker = innings.nonStriker;
  innings.nonStriker = temp;
}

// 🔥 IF ODD RUNS → SWAP AFTER NEW BATSMAN

  

  ensureBattingRecord(nextBatsman, true);
  ensureBattingRecord(survivingBatter, true);
  assertValidActiveBatters(innings, "Post-wicket batting state");
}  
// ✅ FINAL STRIKE UPDATE (SINGLE SOURCE OF TRUTH)
updateStrikeAfterBall(innings, ballEvent, event);

assertValidActiveBatters(
  innings,
  "Post-ball batting state",
  innings.completed || innings.wickets >= 10
);

// 🔥 FINAL SAFETY — NEVER ALLOW EMPTY PLAYERS
  if (innings.ball >= 6) {
  const completedOver = innings.over;

  innings.ball = 0;
  innings.over += 1;

  saveSnapshot(state.matchId, inningsIndex, completedOver, next);
}

  const totalBallsAfter = innings.over * 6 + innings.ball;

  if (innings.wickets >= 10) {
    completeCurrentInnings(next);
  } else if (next.configOvers !== null && totalBallsAfter >= next.configOvers * 6) {
    completeCurrentInnings(next);
  }

  checkChaseCompleted(next);

  return { next, ballEvent };
}
export function dispatchBallEvent(
  matchId: string,
  event: EngineBallEvent
): DispatchBallEventResult {
  let current = matches.get(matchId);

  if (current?.matchEnded) {
    return { ok: false, reason: "MATCH_ENDED" };
  }

  if (!current) {
    initMatch(matchId);
    current = matches.get(matchId)!;
  }

  const innings = current.innings[current.currentInningsIndex];
  if (innings?.completed) {
    return { ok: false, reason: "INNINGS_COMPLETED" };
  }

  if (
    event.type === "CORRECTION_UNDO_LAST" ||
    event.type === "CORRECTION_DELETE" ||
    event.type === "CORRECTION_REPLACE"
  ) {
    return { ok: false, reason: "CORRECTION_EVENT_IGNORED" };
  }

  const eventId = event.id;
  if (eventId && eventStreams[matchId]?.some((e) => e.id === eventId)) {
    return { ok: false, reason: "DUPLICATE_EVENT" };
  }

  /*
  ========================================
  REDUCE ENGINE STATE
  ========================================
  */

  const { next, ballEvent } = reduce(current, event);

  if (!ballEvent.valid) {
    return { ok: false, reason: "INVALID_EVENT" };
  }

  /*
  ========================================
  COMMENTARY + SIGNALS
  ========================================
  */

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

// ✅ ADD THIS (MOVE HERE)
if (!eventStreams[matchId]) {
  eventStreams[matchId] = [];
}
eventStreams[matchId].push(ballEvent);

updatePlayerRegistry(matchId);

  ballEvent.commentary = commentaryText;

  /*
  ========================================
  SAVE STATE
  ========================================
  */

  const freshState = cloneState(next);
  matches.set(matchId, freshState);
  setMatchState(matchId, freshState);

  // ==============================
// ✅ ANALYTICS + COMMENTARY PIPELINE (FIXED)
// ==============================

// 🧠 SAFE STATE
const state = freshState;

// 🟢 BALL INDEX
const currentInningsState =
  state.innings[state.currentInningsIndex];
const ballIndex =
  currentInningsState.over * 6 +
  currentInningsState.ball;

// ⚡ MOMENTUM UPDATE
processMomentumEvent(matchId, ballEvent, ballIndex);

// 📝 COMMENTARY STORE
addCommentary(matchId, commentaryText);

// 🧠 INSIGHTS
generateBroadcastInsights(matchId);
const insights = getBroadcastInsights(matchId) || [];
// 🔥 WIN PROBABILITY (ML/LEGACY HYBRID ENGINE)
const prediction = predictWinProbabilityFromState(
  matchId,
  state,
  eventStreams[matchId] ?? []
);

// 📊 MOMENTUM TIMELINE
const momentumTimeline = getMomentumTimeline(matchId);

// 📦 STORE ANALYTICS
// 🔥 GET PREVIOUS ANALYTICS
const prevAnalytics = getAnalytics(matchId) || {
  winProbability: [],
  momentum: [],
};

// 🔥 APPEND (DO NOT REPLACE)
const updatedWinProbability = [
  ...prevAnalytics.winProbability,
  {
    over: currentInningsState.over + currentInningsState.ball / 10,
    value: prediction.battingWinProbability,
    confidence: prediction.confidence,
    delta:
      prediction.battingWinProbability -
      (prevAnalytics.prediction?.currentProbability ?? prediction.battingWinProbability),
    modelVersion: prediction.modelVersion,
    timestamp: Date.now(),
    marker:
      Math.abs(
        prediction.battingWinProbability -
          (prevAnalytics.prediction?.currentProbability ?? prediction.battingWinProbability)
      ) >= 8
        ? "SWING"
        : undefined,
  },
];

// 📦 STORE ANALYTICS
setAnalytics(matchId, {
  winProbability: updatedWinProbability,
  momentum: momentumTimeline.map(p => ({
    over: Math.floor(p.ballIndex / 6),
    score: p.momentum,
  })),
  prediction: {
    currentProbability: prediction.battingWinProbability,
    previousProbability:
      prevAnalytics.prediction?.currentProbability ?? prediction.battingWinProbability,
    probabilityDelta:
      prediction.battingWinProbability -
      (prevAnalytics.prediction?.currentProbability ?? prediction.battingWinProbability),
    confidence: prediction.confidence,
    modelVersion: prediction.modelVersion,
    predictionTimestamp: Date.now(),
    latencyMs: prediction.latencyMs,
    cacheHit: prediction.cacheHit,
    debounced: prediction.debounced,
  },
});
// ========================================
// 🔥 FINAL BROADCAST (CLEAN & SINGLE)
// ========================================

const updatedState = getMatchState(matchId);

if (!updatedState) {
  console.error("❌ Missing state before broadcast");
  return {
    ok: false,
    reason: "INVALID_EVENT",
  };
}

// 📊 FINAL DATA SNAPSHOT
const analytics = getAnalytics(matchId);
const commentaryList = getCommentary(matchId);
const sequence = eventStreams[matchId]?.length ?? 0;
const eventMeta = {
  eventId: ballEvent.id,
  sequence,
  timestamp: ballEvent.timestamp,
  matchId,
  innings: state.currentInningsIndex,
  over: currentInningsState.over,
  ball: currentInningsState.ball,
  eventType: ballEvent.type,
} as const;

appendEventTimeline(matchId, eventMeta);
appendCommentaryTimeline({
  matchId,
  eventId: ballEvent.id,
  sequence,
  timestamp: ballEvent.timestamp,
  text: commentaryText,
  source: "ENGINE",
});

// 📡 BROADCAST BALL EVENT
broadcast(matchId, {
  type: "BALL_EVENT",
  matchId,
  data: {
    committedState: updatedState,
    engineEvent: {
      id: ballEvent.id,
    },
    eventMeta,
    commentary: commentaryList ?? [],
    insights: insights ?? [],
    analytics: analytics ?? null,
  },
});

// 🏁 MATCH END EVENT
if (updatedState.matchEnded) {
  broadcast(matchId, {
    type: "MATCH_ENDED",
    matchId,
    data: {
      winner: updatedState.winner,
      winBy: updatedState.winBy,
    },
  });
}
  
// ========================================
// 🏁 MATCH END
// ========================================

if (updatedState.matchEnded) {
  broadcast(matchId, {
    type: "MATCH_ENDED",
    matchId,
    data: {
      winner: updatedState.winner,
      winBy: updatedState.winBy,
    },
  });
}

  /*
  ========================================
  STORE EVENT
  ========================================
  */

  

  getStorageModule()
    .then(async ({ appendEvent }) => {
      await appendEvent(matchId, ballEvent);
      await recordBallEvent(matchId, ballEvent);
    })
    .catch(console.error);

  /*
  ========================================
  TIMELINE + INTELLIGENCE
  ========================================
  */

  pushToTimeline({
    ...ballEvent,
    commentary: commentaryText,
  });

  advanceClock(matchId);

  processMatchIntelligence({
    matchId,
    branchId: freshState.activeBranchId,
    state: freshState,
    ballEvent,
  }).catch(console.error);

  /*
  ========================================
  FINAL EMIT (UI HOOK)
  ========================================
  */

  emit(matchId);

  return {
    ok: true,
    matchId,
    state: freshState,
    ballEvent: { ...ballEvent },
  };
}

export function getMatchState(matchId: string) {
  const state = matches.get(matchId);
  return state ? cloneState(state) : undefined;
}

export function getEventStream(matchId: string) {
  return eventStreams[matchId] ?? [];
}

export function subscribeMatch(
  matchId: string,
  cb: (state: MatchState) => void
) {
  if (!matchListeners[matchId]) {
    matchListeners[matchId] = new Set();
  }

  matchListeners[matchId].add(cb);

  const current = matches.get(matchId);
  if (current) {
    cb(cloneState(current));
  }

  return () => {
    matchListeners[matchId].delete(cb);

    if (matchListeners[matchId].size === 0) {
      delete matchListeners[matchId];
    }
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
  setMatchState(matchId, next);

  // 🔥 CRITICAL FIX
  if (!eventStreams[matchId]) {
    eventStreams[matchId] = [];
  }

  emit(matchId);
}
export function reduceStateOnly(state: MatchState, event: BallEvent): MatchState {
  const inningsIndex = event.innings ?? state.currentInningsIndex;
  const replayState = cloneState(state);
  replayState.currentInningsIndex = inningsIndex;

  if (inningsIndex === 1) {
    ensureSecondInningsFromFirst(replayState);
  }

  const innings = replayState.innings[inningsIndex];
  if (!innings) {
    throw new Error(`❌ Missing replay innings state for innings ${inningsIndex}`);
  }

  const fallbackInitial = getInitialBattingBowlingTeams(replayState);

  const resolvedBattingTeam =
    inningsIndex === 1 &&
    replayState.innings[0]?.battingTeam &&
    replayState.innings[0]?.bowlingTeam
      ? replayState.innings[0].bowlingTeam
      : innings.battingTeam || fallbackInitial.battingTeam;

  const resolvedBowlingTeam =
    inningsIndex === 1 &&
    replayState.innings[0]?.battingTeam &&
    replayState.innings[0]?.bowlingTeam
      ? replayState.innings[0].battingTeam
      : innings.bowlingTeam || fallbackInitial.bowlingTeam;

  const bowler = event.bowler?.trim();
  if (!bowler) {
    throw new Error(
      `❌ Replay event missing bowler identity: ${event.id ?? "unknown-event"}`
    );
  }

  const eventType = event.type as ScoringEvent["type"];

  const runs =
    event.type === "RUN" || event.type === "BYE" || event.type === "LB"
      ? event.runs ?? 0
      : undefined;

 const currentStriker = innings.striker?.trim() ?? "";
const currentNonStriker = innings.nonStriker?.trim() ?? "";

let resolvedStriker = currentStriker;
let resolvedNonStriker = currentNonStriker;

// Replay bootstrap: only allowed when engine pair is still empty.
if (!resolvedStriker && !resolvedNonStriker) {
  const eventStriker = event.batsman?.trim() ?? "";
  const eventNonStriker = event.nonStriker?.trim() ?? "";

  if (!eventStriker || !eventNonStriker) {
    throw new Error(
      `❌ Replay bootstrap failed: missing batting pair for event ${event.id ?? "unknown-event"}`
    );
  }

  if (eventStriker === eventNonStriker) {
    throw new Error(
      `❌ Replay bootstrap failed: duplicate batting pair ${eventStriker}`
    );
  }

  resolvedStriker = eventStriker;
  resolvedNonStriker = eventNonStriker;
}

if (!resolvedStriker || !resolvedNonStriker) {
  throw new Error(
    `❌ Replay could not resolve engine batting pair: ${event.id ?? "unknown-event"}`
  );
}

if (resolvedStriker === resolvedNonStriker) {
  throw new Error(
    `❌ Replay resolved invalid batting pair: ${resolvedStriker}`
  );
}

  const engineEvent = {
  id: event.id,
  type: eventType,
  runs,
  batsman: resolvedStriker,
  nonStriker: resolvedNonStriker,
  bowler,
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
  resetEventTimeline(matchId);
  resetCommentaryTimeline(matchId);

  // 🔥 CLEAR PLAYER REGISTRY (VERY IMPORTANT)
  clearPlayerRegistry(matchId);

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
export function restoreMatchState(matchId: string, state: MatchState) {
  const next = cloneState(state);
  matches.set(matchId, next);
  setMatchState(matchId, next);
  emit(matchId);
}
export function setMatchState(matchId: string, state: MatchState) {
  // ✅ update engine
  matches.set(matchId, state);

  // 🔥 ALSO update UI STORE
  try {
    setUIState(matchId, state);
  } catch (e) {
    console.warn("⚠️ UI sync failed", e);
  }
}

export function syncBattingOrder(
  matchId: string,
  players: string[]
) {
  const state = matches.get(matchId);

  if (!state) {
    console.warn("⚠️ syncBattingOrder: match state missing");
    return;
  }

  const innings = state.innings[state.currentInningsIndex];

  if (!innings) {
    console.warn("⚠️ syncBattingOrder: innings missing");
    return;
  }

  // ✅ ALWAYS FORCE UPDATE
  innings.battingOrder = [...players];

  // ✅ Bootstrap only if empty
  if (!innings.striker && !innings.nonStriker) {
    innings.striker = players[0] || "";
    innings.nonStriker = players[1] || "";
    innings.nextBatsmanIndex = 2;
  }

  console.log("🏏 ENGINE BATTING ORDER SYNCED", {
    players,
    striker: innings.striker,
    nonStriker: innings.nonStriker,
  });
}
