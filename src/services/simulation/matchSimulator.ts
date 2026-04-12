import { generateBallEvent } from "./ballGenerator";
import { SimulationState } from "./simulationState";
import { BallEvent } from "@/types/ballEvent";
import { dispatchBallEvent, getMatchState } from "../matchEngine";
import { toEngineEvent } from "./simulationEventAdapter";
import { addCommentary } from "../commentary/commentaryStore";
import { generateAdvancedCommentary } from "../commentary/advancedCommentaryEngine";
import { getBattingOrder } from "../teams/battingOrder";
import { Team } from "@/data/teams";
import { getBowlingOrder } from "../teams/bowlingOrder";
import { getMatchResult } from "../match/resultEngine";
import { getPlayingXI } from "../teams/playingXI";
import { getPlayerName } from "@/utils/playerUtils";

let timeoutRef: NodeJS.Timeout | null = null;
let isRunning = false;
let isPaused = false;
let currentSpeed = 1500;

function createBowlingPlan(bowlingOrder: string[]) {
  const plan: string[] = [];
  const maxOvers = 20;
  const maxPerBowler = 4;

  const counts: Record<string, number> = {};
  bowlingOrder.forEach(b => (counts[b] = 0));

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

  state.striker = state.battingOrder[0];
  state.nonStriker = state.battingOrder[1];
  state.nextBatsmanIndex = 2;

  state.currentBowlerIndex = 0;
  state.bowler = state.bowlingOrder[0];

  state.bowlingPlan = createBowlingPlan(
    state.bowlingOrder.map(getPlayerName)
  );

  state.over = 0;
  state.ball = 0;
  state.totalRuns = 0;
  state.wickets = 0;
  state.currentInningsIndex = 0;

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

  state.striker = state.battingOrder[0];
  state.nonStriker = state.battingOrder[1];
  state.nextBatsmanIndex = 2;

  state.currentBowlerIndex = 0;
  state.bowler = state.bowlingOrder[0];

  state.bowlingPlan = createBowlingPlan(
    state.bowlingOrder.map(getPlayerName)
  );

  state.over = 0;
  state.ball = 0;
  state.totalRuns = 0;
  state.wickets = 0;
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
}

function updateState(state: SimulationState, event: BallEvent) {
  const runs = event.runs ?? 0;
  state.totalRuns += runs;

  if (!event.wicket && runs % 2 === 1) {
    const temp = state.striker;
    state.striker = state.nonStriker;
    state.nonStriker = temp;
  }

  if (event.wicket) {
    state.wickets++;
    handleWicket(state);
  }
}

function handleWicket(state: SimulationState) {
  if (state.nextBatsmanIndex >= state.battingOrder.length) {
    console.log("💀 All out");
    return;
  }

  const next = state.battingOrder[state.nextBatsmanIndex];
  if (!next) {
    console.log("💀 All out");
    return;
  }

  state.striker = next;
  state.nextBatsmanIndex++;
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
  const wicketsLeft = 10 - state.wickets;

  const result = getMatchResult(teamA, teamB, scoreA, scoreB, wicketsLeft);

  state.winner = result.winner;
  state.winBy = result.winBy;
}

export function startSimulation(
  state: SimulationState,
  matchId: string,
  speed: number = 1500
) {
  const matchState = getMatchState(matchId);
  if (!matchState) return;

  if (isRunning) {
    console.log("⚠️ Simulation already running");
    return;
  }

  stopSimulation();

  isRunning = true;
  isPaused = false;
  currentSpeed = speed;

  matchState.teamA = state.teamA;
  matchState.teamB = state.teamB;
  matchState.tossWinner = state.tossWinner;
  matchState.decision = state.decision;

  initializeFirstInnings(state);

  const runBall = () => {
    if (!isRunning) return;

    if (isPaused) {
      timeoutRef = setTimeout(runBall, 500);
      return;
    }

    const engineState = getMatchState(matchId);
    if (!engineState) return;

    if (engineState.currentInningsIndex >= 2) {
      stopSimulation();
      return;
    }

    const engineInningsIndex = engineState.currentInningsIndex;
    const engineInnings = engineState.innings[engineInningsIndex];
    if (!engineInnings) return;

    if (engineInnings.completed) {
      if (engineInningsIndex === 0) {
        state.target = engineState.innings[0]?.runs + 1;

        if (state.currentInningsIndex !== 1) {
          startSecondInnings(state);
        }

        timeoutRef = setTimeout(runBall, currentSpeed);
        return;
      }

      if (engineInningsIndex === 1) {
        finishMatch(state, engineState);
        stopSimulation();
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
      const bowlerObj = state.bowlingOrder.find(
        b => getPlayerName(b) === bowlerName
      );
      if (bowlerObj) {
        state.bowler = bowlerObj;
      }
    }

    if (
      state.currentInningsIndex === 1 &&
      engineInnings.over === 0 &&
      engineInnings.ball === 0
    ) {
      state.striker = state.battingOrder[0];
      state.nonStriker = state.battingOrder[1];
      state.nextBatsmanIndex = 2;
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
    if (!event) return;

    const engineEvent = toEngineEvent({
      ...event,
      batsman: getPlayerName(state.striker),
      nonStriker: getPlayerName(state.nonStriker),
      bowler: getPlayerName(state.bowler),
      battingTeam: state.battingTeam.name,
      bowlingTeam: state.bowlingTeam.name
    });

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

    dispatchBallEvent(matchId, engineEvent);

    const latestAfterDispatch = getMatchState(matchId);
    if (!latestAfterDispatch) {
      console.groupEnd();
      return;
    }

    const commentary = generateAdvancedCommentary(event, {
      ...latestAfterDispatch,
      ...syncedState
    });

    addCommentary(matchId, commentary);

    updateState(state, {
      ...event,
      batsman: getPlayerName(syncedState.striker),
      nonStriker: getPlayerName(syncedState.nonStriker),
      bowler: getPlayerName(state.bowler)
    });

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

    if (state.target && state.totalRuns >= state.target) {
      finishMatch(state, latestAfterDispatch);
      stopSimulation();
      return;
    }

    const delay = Math.random() * 400 + currentSpeed;
    timeoutRef = setTimeout(runBall, delay);
  };

  runBall();
}

export function stopSimulation() {
  if (timeoutRef) {
    clearTimeout(timeoutRef);
    timeoutRef = null;
  }

  isRunning = false;
  isPaused = false;
}

export function pauseSimulation() {
  if (!isRunning) return;
  isPaused = true;
}

export function resumeSimulation() {
  if (!isRunning) return;
  isPaused = false;
}

export function setSimulationSpeed(speed: number) {
  currentSpeed = speed;
}