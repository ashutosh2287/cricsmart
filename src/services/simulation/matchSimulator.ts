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
  if (isRunning) {
    console.log("⚠️ Simulation already running");
    return;
  }

  stopSimulation();

  isRunning = true;
  isPaused = false;
  currentSpeed = speed;

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

      // ✅ FIRST INNINGS → SWITCH TO SECOND
      if (index === 0) {
        console.log("🔄 Switching to 2nd innings");

        matchState.currentInningsIndex = 1;

        const first = matchState.innings[0];
        state.target = first.runs + 1;

        // 🔁 RESET SIMULATION STATE
        state.over = 0;
        state.ball = 0;
        state.totalRuns = 0;
        state.wickets = 0;

        state.striker = state.battingOrder[0];
        state.nonStriker = state.battingOrder[1];
        state.nextBatsmanIndex = 2;

        timeoutRef = setTimeout(runBall, currentSpeed);
        return;
      }

      // ✅ SECOND INNINGS → STOP MATCH
      if (index === 1) {
        console.log("🏆 Match finished (2 innings only)");
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

    const engineEvent = toEngineEvent(event);
    dispatchBallEvent(matchId, engineEvent);

    const commentary = generateAdvancedCommentary(event, {
  ...matchState,
  ...syncedState
});

    addCommentary(matchId, commentary);

    updateState(state, event);

    state.over = over;
    // 🔁 OVER COMPLETION ROTATION
if (ball === 5) { // last ball of over (0-based index)
  [state.striker, state.nonStriker] = [
    state.nonStriker,
    state.striker
  ];
}

    /* =============================
       🎯 TARGET CHASE STOP
    ============================= */
    if (state.target && state.totalRuns >= state.target) {
      console.log("🎉 Target chased");
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

  // ✅ update total
  state.totalRuns += runs;

  // 🔥 STRIKE ROTATION (MAIN FIX)
  if (runs % 2 === 1) {
    [state.striker, state.nonStriker] = [
      state.nonStriker,
      state.striker
    ];
  }

  // ✅ wicket handling
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

  // ✅ new batsman comes on strike
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