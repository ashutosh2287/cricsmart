import { generateBallEvent } from "./ballGenerator";
import { SimulationState } from "./simulationState";
import { BallEvent } from "@/types/ballEvent";
import { dispatchBallEvent, getMatchState } from "../matchEngine";
import { toEngineEvent } from "./simulationEventAdapter";
import { addCommentary } from "../commentary/commentaryStore";
import { generateAdvancedCommentary } from "../commentary/advancedCommentaryEngine";
import { getBattingOrder } from "../teams/battingOrder";
import { Player, Team, teams } from "@/data/teams";
import { getBowlingOrder } from "../teams/bowlingOrder";
import { getMatchResult } from "../match/resultEngine";
import { getPlayingXI } from "../teams/playingXI";
/* =====================================================
   GLOBAL STATE (IMPORTANT)
===================================================== */

let timeoutRef: NodeJS.Timeout | null = null;
let isRunning = false;
let isPaused = false;
let currentSpeed = 1500; // default delay

/* =====================================================
   START SIMULATION
===================================================== */

export function startSimulation(
  state: SimulationState,
  matchId: string,
  speed: number = 1500
) {
  const matchState = getMatchState(matchId);
if (!matchState) return;

// 🔥 SYNC ENGINE STATE → MATCH STATE
matchState.teamA = state.teamA;
matchState.teamB = state.teamB;

matchState.tossWinner = state.tossWinner;
matchState.decision = state.decision;

matchState.currentInningsIndex = state.currentInningsIndex;
  if (isRunning) {
    console.log("⚠️ Simulation already running");
    return;
  }

  stopSimulation();

  isRunning = true;
  isPaused = false;
  currentSpeed = speed;

  // 🔥 INIT ONLY ON FIRST RUN
if (!state.battingOrder || state.battingOrder.length === 0) {
  console.log("🏏 Setting Playing XI + Batting Order");

  // 👉 SELECT TEAMS (for now fixed)
  const teamA = state.teamA;
const teamB = state.teamB;

  if (!teamA || !teamB) {
    console.log("❌ Teams not found");
    return;
  }

  // 👉 FIRST INNINGS TEAM (India batting)
  const battingXI = getPlayingXI(teamA).players;
const bowlingXI = getPlayingXI(teamB).players;

const battingOrder = getBattingOrder(battingXI);
const bowlingOrder = getBowlingOrder(bowlingXI);

state.battingOrder = battingOrder;
state.bowlingOrder = bowlingOrder;

state.currentBowlerIndex = 0;
state.bowler = bowlingOrder[0];
  state.nextBatsmanIndex = 2;

  state.striker = battingOrder[0];
  state.nonStriker = battingOrder[1];

  console.log("🧠 Batting Order:", battingOrder);
}

  const runBall = () => {
    if (!isRunning) return;
    

    if (isPaused) {
      timeoutRef = setTimeout(runBall, 500);
      return;
    }

    const matchState = getMatchState(matchId);

    if (!matchState) {
      timeoutRef = setTimeout(runBall, 1000);
      return;
    }

    /* =============================
       🔒 HARD STOP (MOST IMPORTANT)
    ============================= */
    if (matchState.currentInningsIndex >= 2) {
      console.log("🛑 Prevented invalid innings (>2)");
      stopSimulation();
      return;
    }

    const index = matchState.currentInningsIndex;
    const innings = matchState.innings[index];

    if (!innings) {
      console.log("❌ Invalid innings");
      stopSimulation();
      return;
    }

    /* =============================
       🏁 INNINGS COMPLETION
    ============================= */
    
    if (innings.completed) {

  const matchState = getMatchState(matchId);
  if (!matchState) return;

  const index = matchState.currentInningsIndex;

  // ✅ FIRST → SECOND INNINGS
  if (index === 0) {

    console.log("🔄 Switching to 2nd innings");

    matchState.currentInningsIndex = 1;

    const first = matchState.innings[0];
    state.target = first.runs + 1;

    // 🔥 SWITCH TEAMS
    // 🔥 SWITCH TEAMS (CORRECT)
const battingXI = getPlayingXI(state.teamB).players;
const bowlingXI = getPlayingXI(state.teamA).players;

    state.battingOrder = getBattingOrder(battingXI);
    state.bowlingOrder = getBowlingOrder(bowlingXI);

    state.striker = state.battingOrder[0];
    state.nonStriker = state.battingOrder[1];
    state.nextBatsmanIndex = 2;

    state.currentBowlerIndex = 0;
    state.bowler = state.bowlingOrder[0];

    // RESET SCORE
    state.over = 0;
    state.ball = 0;
    state.totalRuns = 0;
    state.wickets = 0;

    timeoutRef = setTimeout(runBall, currentSpeed);
    return;
  }

  // ✅ MATCH END
  if (index === 1) {
    console.log("🏆 Match finished");

    finishMatch(state, matchState);
    stopSimulation();
    return;
  }
}

    /* =============================
       NORMAL BALL FLOW
    ============================= */

    const over = innings.over;
    const ball = innings.ball;

    const prevOver = state.over;

    if (over !== prevOver) {
      rotateBowler(state);
    }

    const currentOverBalls = innings.overs[over] || [];
    const prevOverBalls = innings.overs[over - 1] || [];

    const lastBall =
      currentOverBalls.length > 0
        ? currentOverBalls[currentOverBalls.length - 1]
        : prevOverBalls[prevOverBalls.length - 1];

    

    // 🔥 ALWAYS SYNC FROM ENGINE
const liveMatchState = getMatchState(matchId);
const liveInnings =
  liveMatchState?.innings[liveMatchState.currentInningsIndex];

const syncedState: SimulationState = {
  ...state,
  over,
  ball,

  phase:
    over < 6
      ? "POWERPLAY"
      : over < 15
      ? "MIDDLE"
      : "DEATH",
};

    const event: BallEvent = generateBallEvent(syncedState);

    if (!event) {
      console.log("❌ Event failed");
      stopSimulation();
      return;
    }


// 🔥 If wicket → send next batsman
const batsman = syncedState.striker;

const engineEvent = toEngineEvent({
  ...event,
  batsman,
  nonStriker: syncedState.nonStriker
});
    dispatchBallEvent(matchId, engineEvent);

    const commentary = generateAdvancedCommentary(event, {
  ...matchState,
  ...syncedState
});

    addCommentary(matchId, commentary);

    updateState(state, event);

    state.over = over;
    // ✅ OVER COMPLETE LOGIC
if (ball === 0 && over > 0) {
  // swap strike at over end
  const temp = state.striker;
  state.striker = state.nonStriker;
  state.nonStriker = temp;

  // rotate bowler
  rotateBowler(state);
}
   


    /* =============================
       🎯 TARGET CHASE STOP
    ============================= */
    if (state.target && state.totalRuns >= state.target) {
  console.log("🎉 Target chased");

  finishMatch(state, matchState); // 🔥 ADD THIS

  stopSimulation();
  return;
}

    const delay = Math.random() * 400 + currentSpeed;
    timeoutRef = setTimeout(runBall, delay);
  };

  console.log("🚀 Simulation started");
  runBall();
}
/* =====================================================
   STOP / PAUSE / RESUME
===================================================== */

export function stopSimulation() {
  if (timeoutRef) {
    clearTimeout(timeoutRef);
    timeoutRef = null;
  }

  isRunning = false;
  isPaused = false;

  console.log("⏹ Simulation stopped");
}

export function pauseSimulation() {
  if (!isRunning) return;

  isPaused = true;
  console.log("⏸ Simulation paused");
}

export function resumeSimulation() {
  if (!isRunning) return;

  isPaused = false;
  console.log("▶ Simulation resumed");
}

/* =====================================================
   OPTIONAL: SPEED CONTROL
===================================================== */

export function setSimulationSpeed(speed: number) {
  currentSpeed = speed;
  console.log("⚡ Speed changed:", speed);
}

/* =====================================================
   HELPERS
===================================================== */

function updateState(state: SimulationState, event: BallEvent) {
  const runs = event.runs ?? 0;

  state.totalRuns += runs;

// ✅ STRIKE ROTATION (RUN BASED)
if (!event.wicket && runs % 2 === 1) {
  const temp = state.striker;
  state.striker = state.nonStriker;
  state.nonStriker = temp;
}

// ✅ WICKET HANDLING
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

  console.log("🚨 Wicket! New batsman:", next);

  // 👉 NEW BATSMAN ALWAYS COMES ON STRIKE
  state.striker = next;

  // 👉 MOVE INDEX
  state.nextBatsmanIndex++;
}

function rotateBowler(state: SimulationState) {
  const totalBowlers = state.bowlingOrder.length;

  let nextIndex = (state.currentBowlerIndex + 1) % totalBowlers;

  // ❗ avoid same bowler repeating
  if (nextIndex === state.currentBowlerIndex) {
    nextIndex = (nextIndex + 1) % totalBowlers;
  }

  state.currentBowlerIndex = nextIndex;
  state.bowler = state.bowlingOrder[nextIndex];

  console.log("🎯 New Over Bowler:", state.bowler);
}
type MatchStateType = NonNullable<ReturnType<typeof getMatchState>>;
function finishMatch(
  state: SimulationState,
  matchState: MatchStateType
) {
  if (state.matchEnded) return;

  state.matchEnded = true;

  const first = matchState.innings[0];
  const second = matchState.innings[1];

  const teamA = state.teamA.name;
  const teamB = state.teamB.name;

  const scoreA = first.runs;
  const scoreB = second.runs;

  const wicketsLeft = 10 - state.wickets;

  const result = getMatchResult(
    teamA,
    teamB,
    scoreA,
    scoreB,
    wicketsLeft
  );

  state.winner = result.winner;
  state.winBy = result.winBy;

  console.log("🏆 MATCH RESULT:", result);
}