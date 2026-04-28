import { generateBallEvent } from "./ballGenerator";
import { SimulationState } from "./simulationState";
import { BallEvent } from "@/types/ballEvent";
import { dispatchBallEvent, getMatchState, initMatch } from "../matchEngine";
import { toEngineEvent } from "./simulationEventAdapter";
import { addCommentary } from "../commentary/commentaryStore";
import { generateAdvancedCommentary } from "../commentary/advancedCommentaryEngine";
import { getBattingOrder } from "../teams/battingOrder";
import { Team } from "@/data/teams";
import { getBowlingOrder } from "../teams/bowlingOrder";
import { getMatchResult } from "../match/resultEngine";
import { getPlayingXI } from "../teams/playingXI";
import { getPlayerName } from "@/utils/playerUtils";
import { saveSimulation } from "@/services/storage/simulationStorage";
import { loadSimulation } from "@/services/storage/simulationStorage";
import { getReplayState } from "@/services/replay/replayEngine";
import { generateBroadcastInsights } from "../broadcast/broadcastInsightEngine";
import { setAnalytics } from "../analytics/liveAnalyticsStore";
import { getWinProbabilityTimeline } from "../analytics/winProbabilityTimelineEngine";
import { getMomentumTimeline } from "../analytics/momentumTimelineEngine";
type RuntimeSimulationControl = {
  timeoutRef: NodeJS.Timeout | null;
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  runBallRef: (() => void) | null;
  isTicking: boolean;
};

const simulationRegistry = new Map<string, RuntimeSimulationControl>();

function emitSimulationState(
  matchId: string,
  control: RuntimeSimulationControl
) {
  const event: SimulationEvent = {
    type: "SIMULATION_STATE_UPDATE",
    matchId,
    data: {
      isRunning: control.isRunning,
      isPaused: control.isPaused,
      speed: control.speed,
    },
  };

  console.log("📡 SIMULATION STATE", event);
} 

function getSimulationControl(matchId: string): RuntimeSimulationControl {
  const existing = simulationRegistry.get(matchId);
  if (existing) return existing;

  const created: RuntimeSimulationControl = {
  timeoutRef: null,
  isRunning: false,
  isPaused: false,
  speed: 1500,
  runBallRef: null,
  isTicking: false,
};

  simulationRegistry.set(matchId, created);
  return created;
}

export function isSimulationRunning(matchId?: string) {
  if (!matchId) return false;
  const control = simulationRegistry.get(matchId);
  return !!control?.isRunning;
}

export function getSimulationRuntime(matchId?: string) {
  if (!matchId) return null;
  const control = simulationRegistry.get(matchId);
  if (!control) return null;

  return {
    isRunning: control.isRunning,
    isPaused: control.isPaused,
    speed: control.speed,
  };
}


export type SimulationEvent =
  | {
      type: "MATCH_ENDED";
      matchId: string;
      data: {
        winner?: string;
        winBy?: string;
      };
    }
  | {
      type: "SIMULATION_STATE_UPDATE";
      matchId: string;
      data: {
        isRunning: boolean;
        isPaused: boolean;
        speed: number;
      };
    };

function createBowlingPlan(bowlingOrder: string[]) {
  const plan: string[] = [];
  const maxOvers = 20;
  const maxPerBowler = 4;

  const counts: Record<string, number> = {};
  bowlingOrder.forEach((b) => (counts[b] = 0));

  let index = 0;

  for (let over = 0; over < maxOvers; over++) {
    let found = false;

    for (let i = 0; i < bowlingOrder.length; i++) {
      const bowler = bowlingOrder[(index + i) % bowlingOrder.length];

      if (counts[bowler] < maxPerBowler) {
        plan.push(bowler);
        counts[bowler]++;
        index = (index + i + 1) % bowlingOrder.length;
        found = true;
        break;
      }
    }

    if (!found) {
      plan.push(bowlingOrder[0]);
    }
  }

  return plan;
}

function getTeamPlayerNames(team: Team) {
  return new Set((getPlayingXI(team).players ?? []).map(getPlayerName));
}

function assertStateTeamsAndPlayers(state: SimulationState) {
  if (!state.battingTeam || !state.bowlingTeam) {
    throw new Error("❌ Simulation state missing batting/bowling teams");
  }

  const battingNames = getTeamPlayerNames(state.battingTeam);
  const bowlingNames = getTeamPlayerNames(state.bowlingTeam);

  const striker = getPlayerName(state.striker);
  const nonStriker = getPlayerName(state.nonStriker);
  const bowler = getPlayerName(state.bowler);

  if (!battingNames.has(striker)) {
    throw new Error(`❌ Striker ${striker} not in batting team ${state.battingTeam.name}`);
  }

  if (!battingNames.has(nonStriker)) {
    throw new Error(`❌ Non-striker ${nonStriker} not in batting team ${state.battingTeam.name}`);
  }

  if (!bowlingNames.has(bowler)) {
    throw new Error(`❌ Bowler ${bowler} not in bowling team ${state.bowlingTeam.name}`);
  }
}

function assertEngineSync(state: SimulationState, matchId: string) {
  const engine = getMatchState(matchId);
  if (!engine) return;

  const innings = engine.innings[engine.currentInningsIndex];
  if (!innings) return;

  if (innings.battingTeam && innings.battingTeam !== state.battingTeam.name) {
    throw new Error(
      `❌ Engine/sim batting mismatch. Engine=${innings.battingTeam}, Sim=${state.battingTeam.name}`
    );
  }

  if (innings.bowlingTeam && innings.bowlingTeam !== state.bowlingTeam.name) {
    throw new Error(
      `❌ Engine/sim bowling mismatch. Engine=${innings.bowlingTeam}, Sim=${state.bowlingTeam.name}`
    );
  }
}

function resolveInitialTeams(state: SimulationState) {
  const teamA = state.teamA;
  const teamB = state.teamB;

  if (!teamA || !teamB) {
    throw new Error("❌ Teams not found");
  }

  let battingTeam: Team;
  let bowlingTeam: Team;

  if (state.tossWinner === teamA.name) {
    if (state.decision === "BAT") {
      battingTeam = teamA;
      bowlingTeam = teamB;
    } else {
      battingTeam = teamB;
      bowlingTeam = teamA;
    }
  } else {
    if (state.decision === "BAT") {
      battingTeam = teamB;
      bowlingTeam = teamA;
    } else {
      battingTeam = teamA;
      bowlingTeam = teamB;
    }
  }

  return { battingTeam, bowlingTeam };
}

function initializeFirstInnings(state: SimulationState) {
  const { battingTeam, bowlingTeam } = resolveInitialTeams(state);

  state.battingTeam = { ...battingTeam };
  state.bowlingTeam = { ...bowlingTeam };

  const battingXI = getPlayingXI(state.battingTeam).players;
  const bowlingXI = getPlayingXI(state.bowlingTeam).players;

  state.battingOrder = getBattingOrder(battingXI);
  state.bowlingOrder = getBowlingOrder(bowlingXI);

    state.striker = getPlayerName(state.battingOrder[0]);
  state.nonStriker = getPlayerName(state.battingOrder[1]);
  state.nextBatsmanIndex = 2;

  state.currentBowlerIndex = 0;
  state.bowler = getPlayerName(state.bowlingOrder[0]);

  state.bowlingPlan = createBowlingPlan(
    state.bowlingOrder.map(getPlayerName)
  );

    state.over = 0;
  state.ball = 0;
  state.currentInningsIndex = 0;
  state.matchEnded = false;
  state.winner = null;
  state.winBy = null;

  assertStateTeamsAndPlayers(state);
}

function startSecondInnings(state: SimulationState) {
  const firstBattingTeam = state.battingTeam;
  const secondBattingTeam =
    firstBattingTeam.name === state.teamA.name
      ? state.teamB
      : state.teamA;

  state.battingTeam = { ...secondBattingTeam };
  state.bowlingTeam = { ...firstBattingTeam };

  const battingXI = getPlayingXI(state.battingTeam).players;
  const bowlingXI = getPlayingXI(state.bowlingTeam).players;

  state.battingOrder = getBattingOrder(battingXI);
  state.bowlingOrder = getBowlingOrder(bowlingXI);

  state.striker = getPlayerName(state.battingOrder[0]);
  state.nonStriker = getPlayerName(state.battingOrder[1]);
  state.nextBatsmanIndex = 2;

  state.currentBowlerIndex = 0;
  state.bowler = getPlayerName(state.bowlingOrder[0]);

  state.bowlingPlan = createBowlingPlan(
    state.bowlingOrder.map(getPlayerName)
  );

    state.over = 0;
  state.ball = 0;
  state.currentInningsIndex = 1;

  assertStateTeamsAndPlayers(state);
}

function syncSimFromEngine(state: SimulationState, matchId: string) {
  const engine = getMatchState(matchId);
  if (!engine) return;

  const inningsIndex = engine.currentInningsIndex;
  const innings = engine.innings[inningsIndex];
  if (!innings) return;

  state.currentInningsIndex = inningsIndex;
  state.over = innings.over;
  state.ball = innings.ball;

  const strikerName = innings.striker?.trim() ?? "";
  const nonStrikerName = innings.nonStriker?.trim() ?? "";

  if (innings.completed || innings.wickets >= 10) {
    return;
  }

  if (!strikerName || !nonStrikerName) {
    console.warn(
      `⚠️ Engine sync skipped due to incomplete batting pair (${strikerName}, ${nonStrikerName})`
    );
    return;
  }

  if (strikerName === nonStrikerName) {
    throw new Error(
      `❌ Invalid engine sync: striker and non-striker are the same player (${strikerName})`
    );
  }

  const strikerExists = state.battingOrder.some(
    (p) => getPlayerName(p) === strikerName
  );
  const nonStrikerExists = state.battingOrder.some(
    (p) => getPlayerName(p) === nonStrikerName
  );

  if (!strikerExists) {
    throw new Error(`❌ Engine striker not found in batting order: ${strikerName}`);
  }

  if (!nonStrikerExists) {
    throw new Error(`❌ Engine non-striker not found in batting order: ${nonStrikerName}`);
  }

  state.striker = strikerName;
  state.nonStriker = nonStrikerName;
}

type MatchStateType = NonNullable<ReturnType<typeof getMatchState>>;

function finishMatch(state: SimulationState, matchState: MatchStateType) {
  if (state.matchEnded) return;

  state.matchEnded = true;

  const first = matchState.innings[0];
  const second = matchState.innings[1];
  if (!first || !second) return;

  const teamA = state.teamA.name;
  const teamB = state.teamB.name;
  const scoreA = first.runs;
  const scoreB = second.runs;
  const wicketsLeft = Math.max(0, 10 - second.wickets);

  const result = getMatchResult(teamA, teamB, scoreA, scoreB, wicketsLeft);

  state.winner = result.winner;
  state.winBy = result.winBy;
}

export async function startSimulation(
  state: SimulationState,
  matchId: string,
  speed: number = 1500
) {
  const control = getSimulationControl(matchId);
  const saved = await loadSimulation(matchId);

if (saved) {
  console.log("♻️ Resuming saved match:", matchId);

  const engineState = getMatchState(matchId);

if (engineState && saved) {
  // Sync ONLY required simulation fields if needed
  state.over = engineState.innings[engineState.currentInningsIndex]?.over ?? 0;
  state.ball = engineState.innings[engineState.currentInningsIndex]?.ball ?? 0;
}

  control.isRunning = saved.control.isRunning;
  control.isPaused = saved.control.isPaused;
  control.speed = saved.control.speed;
}

  if (control.isRunning || control.runBallRef) {
  console.log(`⚠️ Simulation already starting/running for match ${matchId}`);
  return {
    started: false,
    alreadyRunning: true,
    reason: "ALREADY_RUNNING" as const,
  };
}

  let matchState = getMatchState(matchId);

  if (!matchState) {
    console.log("⚠️ matchState missing → initializing...");
    initMatch(matchId);
    matchState = getMatchState(matchId);
  }

  if (!matchState) {
    console.error("❌ matchState STILL missing after init");
    return {
      started: false,
      alreadyRunning: false,
      reason: "MATCH_STATE_MISSING" as const,
    };
  }

  if (control.isRunning || control.runBallRef || control.timeoutRef) {
  console.log(`⚠️ Simulation already starting/running for match ${matchId}`);
  return {
    started: false,
    alreadyRunning: true,
    reason: "ALREADY_RUNNING" as const,
  };
}

if (control.timeoutRef) {
  clearTimeout(control.timeoutRef);
  control.timeoutRef = null;
}

control.isRunning = true;
control.isPaused = false;
control.speed = speed;
control.runBallRef = null;
control.isTicking = false;
emitSimulationState(matchId, control);

  matchState.teamA = state.teamA;
  matchState.teamB = state.teamB;
  matchState.tossWinner = state.tossWinner;
  matchState.decision = state.decision;

  initializeFirstInnings(state);
  syncSimFromEngine(state, matchId);

      const runBall = () => {
        control.runBallRef = runBall;
    if (control.isTicking) return;
    control.isTicking = true;

    try {
      const replay = getReplayState(matchId);
      if (replay?.isReplayMode) {
        return;
      }

      console.log("🏏 RUNNING BALL LOOP", matchId);

      if (!control.isRunning) return;

      if (control.timeoutRef) {
        clearTimeout(control.timeoutRef);
        control.timeoutRef = null;
      }

      if (control.isPaused) {
        return;
      }

      const engineState = getMatchState(matchId);
      if (!engineState) {
        stopSimulation(matchId);
        return;
      }

      if (engineState.currentInningsIndex >= 2) {
        stopSimulation(matchId);
        return;
      }

      const engineInningsIndex = engineState.currentInningsIndex;
      const engineInnings = engineState.innings[engineInningsIndex];
      if (!engineInnings) {
        stopSimulation(matchId);
        return;
      }

      if (engineInnings.completed) {
        if (engineInningsIndex === 0) {
          state.target = (engineState.innings[0]?.runs ?? 0) + 1;

          const latest = getMatchState(matchId);
          if (latest?.currentInningsIndex === 1 && state.currentInningsIndex !== 1) {
            startSecondInnings(state);
            syncSimFromEngine(state, matchId);
          }

          control.timeoutRef = setTimeout(runBall, control.speed);
          return;
        }

        if (engineInningsIndex === 1) {
          finishMatch(state, engineState);
          stopSimulation(matchId);
          return;
        }
      }

      syncSimFromEngine(state, matchId);

      const latestEngineState = getMatchState(matchId);
      const latestEngineInnings =
        latestEngineState?.innings[latestEngineState.currentInningsIndex];

      if (
        latestEngineState &&
        latestEngineInnings &&
        latestEngineState.currentInningsIndex === 1 &&
        latestEngineInnings.battingTeam &&
        latestEngineInnings.bowlingTeam &&
        (
          state.battingTeam.name !== latestEngineInnings.battingTeam ||
          state.bowlingTeam.name !== latestEngineInnings.bowlingTeam
        )
      ) {
        startSecondInnings(state);
      }

      const over = Math.floor(engineInnings.over);
            if (state.bowlingPlan && state.bowlingPlan[over]) {
        const bowlerName = state.bowlingPlan[over];
        const bowlerExists = state.bowlingOrder.some(
          (b) => getPlayerName(b) === bowlerName
        );

        if (bowlerExists) {
          state.bowler = bowlerName;
        }
      }

      assertStateTeamsAndPlayers(state);
      assertEngineSync(state, matchId);

      const syncedState: SimulationState = {
        ...state,
        battingOrder: [...state.battingOrder],
        bowlingOrder: [...state.bowlingOrder],
        striker: state.striker,
        nonStriker: state.nonStriker,
        bowler: state.bowler,
        battingTeam: state.battingTeam,
        bowlingTeam: state.bowlingTeam,
        over: engineInnings.over,
        ball: engineInnings.ball,
        phase:
          over < 6 ? "POWERPLAY" :
          over < 15 ? "MIDDLE" : "DEATH"
      };

const event: BallEvent = generateBallEvent(syncedState);

const currentBowlerName = getPlayerName(syncedState.bowler);
if (!currentBowlerName) {
  throw new Error("❌ Missing bowler identity in simulation state");
}

if (!event) {
  control.timeoutRef = setTimeout(runBall, control.speed);
  return;
}

const engineStateBeforeDispatch = getMatchState(matchId);
const engineInningsBeforeDispatch =
  engineStateBeforeDispatch?.innings[engineStateBeforeDispatch.currentInningsIndex];

if (!engineStateBeforeDispatch || !engineInningsBeforeDispatch) {
  throw new Error("❌ Missing engine state before dispatch");
}

const engineStriker = engineInningsBeforeDispatch.striker?.trim();
const engineNonStriker = engineInningsBeforeDispatch.nonStriker?.trim();

if (!engineStriker || !engineNonStriker) {
  throw new Error("❌ Engine batting pair missing before dispatch");
}

const engineEvent = toEngineEvent({
  ...event,
  batsman: engineStriker,
  nonStriker: engineNonStriker,
  bowler: currentBowlerName,
  battingTeam: engineInningsBeforeDispatch.battingTeam ?? state.battingTeam.name,
  bowlingTeam: engineInningsBeforeDispatch.bowlingTeam ?? state.bowlingTeam.name,
});

const result = dispatchBallEvent(matchId, engineEvent);

if (!result.ok) {
  throw new Error(`❌ Engine rejected ball event: ${result.reason}`);
}

syncSimFromEngine(state, matchId);

      console.group(`🏏 BALL ${engineInningsIndex}:${engineInnings.over}.${engineInnings.ball}`);
      console.log("SIM STATE", {
        innings: state.currentInningsIndex,
        battingTeam: state.battingTeam.name,
        bowlingTeam: state.bowlingTeam.name,
        striker: getPlayerName(state.striker),
        nonStriker: getPlayerName(state.nonStriker),
        bowler: getPlayerName(state.bowler)
      });
      console.log("ENGINE EVENT", engineEvent);

      

     // 🔥 GET RAW DATA FROM ENGINES


// 🔥 STORE


    

      const updatedEngine = getMatchState(matchId);
      const updatedInnings =
        updatedEngine?.innings[updatedEngine.currentInningsIndex];

      console.log("✅ ENGINE COMMITTED EVENT", {
        matchId,
        over: updatedInnings?.over,
        ball: updatedInnings?.ball,
      });

      const latestAfterDispatch = getMatchState(matchId);
      if (!latestAfterDispatch) {
        console.groupEnd();
        stopSimulation(matchId);
        return;
      }

      const commentary = generateAdvancedCommentary(event, {
  ...latestAfterDispatch,
  ...syncedState
});

// 🔥 1. CALCULATE ANALYTICS FIRST
const winTimeline = getWinProbabilityTimeline(matchId);
const momentumTimeline = getMomentumTimeline(matchId);

// 🔥 TRANSFORM
const winProbability = (winTimeline?.timeline ?? []).map(
  (p: { over: number; batting: number }) => ({
    over: p.over,
    value: p.batting,
  })
);

const momentum = (momentumTimeline ?? []).map(
  (p: { ballIndex: number; momentum: number }) => ({
    over: Math.floor(p.ballIndex / 6),
    score: p.momentum,
  })
);

// 🔥 2. STORE EVERYTHING FIRST
addCommentary(matchId, commentary);
generateBroadcastInsights(matchId);

setAnalytics(matchId, {
  winProbability,
  momentum,
});








      const latestMatchState = getMatchState(matchId);
      if (latestMatchState) {
        saveSimulation(matchId, latestMatchState, {
          isRunning: control.isRunning,
          isPaused: control.isPaused,
          speed: control.speed,
        }).catch(console.error);
      }

      const latestInnings =
        latestAfterDispatch.innings[latestAfterDispatch.currentInningsIndex];

      if (latestInnings) {
        state.over = latestInnings.over;
        state.ball = latestInnings.ball;
      }

      console.log("ENGINE AFTER", {
        currentInningsIndex: latestAfterDispatch.currentInningsIndex,
        innings0: latestAfterDispatch.innings[0]
          ? {
              battingTeam: latestAfterDispatch.innings[0].battingTeam,
              bowlingTeam: latestAfterDispatch.innings[0].bowlingTeam,
              runs: latestAfterDispatch.innings[0].runs,
              wickets: latestAfterDispatch.innings[0].wickets
            }
          : null,
        innings1: latestAfterDispatch.innings[1]
          ? {
              battingTeam: latestAfterDispatch.innings[1].battingTeam,
              bowlingTeam: latestAfterDispatch.innings[1].bowlingTeam,
              runs: latestAfterDispatch.innings[1].runs,
              wickets: latestAfterDispatch.innings[1].wickets
            }
          : null
      });
      console.groupEnd();

      const latestCommittedInnings =
        latestAfterDispatch.innings[latestAfterDispatch.currentInningsIndex];

      if (
        latestAfterDispatch.currentInningsIndex === 1 &&
        latestCommittedInnings?.completed
      ) {
        finishMatch(state, latestAfterDispatch);
        stopSimulation(matchId);
        return;
      }

      const jitter = control.speed * 0.1;
      const delay = control.speed + (Math.random() * jitter - jitter / 2);

      control.timeoutRef = setTimeout(runBall, delay);
    } catch (error) {
      console.error("❌ matchSimulator runBall failed", error);
      stopSimulation(matchId);
      return;
    } finally {
      control.isTicking = false;
    }
  };

  control.runBallRef = runBall;

// 🔥 START SIMULATION
control.timeoutRef = setTimeout(runBall, control.speed);

return {
  started: true,
  alreadyRunning: false,
  reason: null,
};
}

export function stopSimulation(matchId?: string) {
  if (!matchId) {
    for (const [id, control] of simulationRegistry.entries()) {
      if (control.timeoutRef) {
        clearTimeout(control.timeoutRef);
        control.timeoutRef = null;
      }
      control.isRunning = false;
      control.isPaused = false;
      control.runBallRef = null;
      control.isTicking = false;
      emitSimulationState(id, control);
      simulationRegistry.delete(id);
    }
    return;
  }

  const control = simulationRegistry.get(matchId);
  if (!control) return;

  if (control.timeoutRef) {
    clearTimeout(control.timeoutRef);
    control.timeoutRef = null;
  }

  control.isRunning = false;
  emitSimulationState(matchId, control);
  control.isPaused = false;
  control.runBallRef = null;
  control.isTicking = false;
  simulationRegistry.delete(matchId);
}

export function pauseSimulation(matchId?: string) {
  if (!matchId) return;
  const control = simulationRegistry.get(matchId);
  if (!control || !control.isRunning) return;
  control.isPaused = true;
  emitSimulationState(matchId, control);
}

export function resumeSimulation(matchId?: string) {
  if (!matchId) return;

  const control = simulationRegistry.get(matchId);
  if (!control || !control.isRunning) return;
  if (!control.isPaused) return;

  control.isPaused = false;
  emitSimulationState(matchId, control);

  if (control.timeoutRef) {
    clearTimeout(control.timeoutRef);
    control.timeoutRef = null;
  }

  if (control.runBallRef && !control.isTicking) {
    control.timeoutRef = setTimeout(control.runBallRef, 0);
  }
}

export function setSimulationSpeed(speed: number, matchId?: string) {
  console.log("⚡ Speed updated:", speed, "match:", matchId ?? "all");

  const apply = (id: string, control: RuntimeSimulationControl) => {
    control.speed = speed;
    emitSimulationState(id, control);

    if (control.timeoutRef) {
      clearTimeout(control.timeoutRef);
      control.timeoutRef = null;
    }

    if (control.isRunning && !control.isPaused && control.runBallRef && !control.isTicking) {
      control.timeoutRef = setTimeout(control.runBallRef, control.speed);
    }
  };

  if (!matchId) {
    for (const [id, control] of simulationRegistry.entries()) {
      apply(id, control);
    }
    return;
  }

  const control = simulationRegistry.get(matchId);
  if (!control) return;

  apply(matchId, control);
}