import { generateBallEvent } from "./ballGenerator";
import { SimulationState } from "./simulationState";
import { BallEvent } from "@/types/ballEvent";
import { dispatchBallEvent, getMatchState } from "../matchEngine";
import { toEngineEvent } from "./simulationEventAdapter";
import { addCommentary } from "../commentary/commentaryStore";
import { generateAdvancedCommentary } from "../commentary/advancedCommentaryEngine";

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
  // 🔥 Prevent duplicate runs
  if (isRunning) {
    console.log("⚠️ Simulation already running");
    return;
  }

  stopSimulation(); // safety reset

  isRunning = true;
  isPaused = false;
  currentSpeed = speed;

  const runBall = () => {
    if (!isRunning) return;

    if (isPaused) {
      // 🔁 Keep checking while paused
      timeoutRef = setTimeout(runBall, 500);
      return;
    }

    console.log("🔥 RUN BALL CALLED");

    const matchState = getMatchState(matchId);

    if (!matchState) {
      console.log("❌ No match state — retrying...");
      timeoutRef = setTimeout(runBall, 1000);
      return;
    }

    const innings =
      matchState.innings[matchState.currentInningsIndex];

    /* =============================
       AUTO INNINGS SWITCH
    ============================= */

   if (innings.completed) {

  const matchState = getMatchState(matchId);

  if (!matchState) {
    stopSimulation();
    return;
  }

  if (matchState.currentInningsIndex === 0) {
    console.log("🔄 Switching to 2nd innings");

    matchState.currentInningsIndex = 1;

    const firstInnings = matchState.innings[0];
    state.target = firstInnings.runs + 1;

    state.over = 0;
    state.ball = 0;
    state.totalRuns = 0;
    state.wickets = 0;

    state.striker = state.battingOrder[0];
    state.nonStriker = state.battingOrder[1];
    state.nextBatsmanIndex = 2;

    return;
  }

  console.log("🏆 Match finished");
  stopSimulation();
  return;
}

    const over = innings.over;
    const ball = innings.ball;

    const prevOver = state.over;

    // 🔄 Bowler rotation
    if (over !== prevOver) {
      rotateBowler(state);
    }

    // 📊 Last ball
    const currentOverBalls = innings.overs[over] || [];
    const prevOverBalls = innings.overs[over - 1] || [];

    const lastBall =
      currentOverBalls.length > 0
        ? currentOverBalls[currentOverBalls.length - 1]
        : prevOverBalls[prevOverBalls.length - 1];

    if (lastBall) {
      state.striker = lastBall.batsman ?? state.striker;
      state.nonStriker = lastBall.nonStriker ?? state.nonStriker;
    }

    // 📊 Sync state
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

    // 🎯 Generate event
    const event: BallEvent = generateBallEvent(syncedState);

    if (!event) {
      console.log("❌ Event generation failed");
      stopSimulation();
      return;
    }

    const engineEvent = toEngineEvent(event);
    dispatchBallEvent(matchId, engineEvent);

    // 🎙 Commentary
    const commentary = generateAdvancedCommentary(event, syncedState);
    addCommentary(matchId, commentary);

    // 📊 Update sim state
    updateState(state, event);

    state.over = over;

    // 🎯 Target chase stop
    if (state.target && state.totalRuns >= state.target) {
      console.log("🎉 Target chased!");
      stopSimulation();
      return;
    }

    // ⏱ Dynamic delay (based on speed)
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
  state.totalRuns += event.runs;

  if (event.wicket) {
    state.wickets++;
    handleWicket(state);
  }
}

function handleWicket(state: SimulationState) {
  const next = state.battingOrder[state.nextBatsmanIndex];

  if (!next) {
    console.log("💀 All out");
    return;
  }

  state.striker = next;
  state.nextBatsmanIndex++;
}

function rotateBowler(state: SimulationState) {
  state.currentBowlerIndex =
    (state.currentBowlerIndex + 1) %
    state.bowlingOrder.length;

  state.bowler =
    state.bowlingOrder[state.currentBowlerIndex];

  console.log("🎯 New Bowler:", state.bowler);
}