import { generateBallEvent } from "./ballGenerator";
import { SimulationState } from "./simulationState";
import { BallEvent } from "@/types/ballEvent";
import { dispatchBallEvent, getMatchState } from "../matchEngine";
import { toEngineEvent } from "./simulationEventAdapter";
import { addCommentary } from "../commentary/commentaryStore";
import { generateAdvancedCommentary } from "../commentary/advancedCommentaryEngine";

let interval: NodeJS.Timeout | null = null;

export function startSimulation(
  state: SimulationState,
  matchId: string
) {
  // ✅ ALWAYS RESET PREVIOUS SIMULATION
  stopSimulation();

  const runBall = () => {
    console.log("🔥 RUN BALL CALLED");

    const matchState = getMatchState(matchId);
    if (!matchState) {
  console.log("❌ No match state — retrying...");

  interval = setTimeout(runBall, 1000);
  return;
}

    const innings =
      matchState.innings[matchState.currentInningsIndex];

    // 🛑 Stop if innings complete
    if (innings.completed) {
      console.log("🏁 Innings completed");
      stopSimulation();
      return;
    }

    const over = innings.over;
    const ball = innings.ball;

    const prevOver = state.over;

    // ✅ Bowler rotation
    if (over !== prevOver) {
      rotateBowler(state);
    }

    // ✅ Last ball fetch
    const currentOverBalls = innings.overs[over] || [];
    const prevOverBalls = innings.overs[over - 1] || [];

    const lastBall =
      currentOverBalls.length > 0
        ? currentOverBalls[currentOverBalls.length - 1]
        : prevOverBalls[prevOverBalls.length - 1];

    // ✅ Sync striker from engine
    if (lastBall) {
      state.striker = lastBall.batsman ?? state.striker;
      state.nonStriker = lastBall.nonStriker ?? state.nonStriker;
    }

    // ✅ Sync state
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

    // 🎯 Generate ball
    const event: BallEvent = generateBallEvent(syncedState);
    console.log("🎯 EVENT:", event);

    if (!event) {
      console.log("❌ Event generation failed");
      stopSimulation();
      return;
    }

    // 🚀 Convert + dispatch
    const engineEvent = toEngineEvent(event);
    console.log("🚀 ENGINE EVENT:", engineEvent);

    dispatchBallEvent(matchId, engineEvent);

    console.log("📊 STATE AFTER:", getMatchState(matchId));

    // 🎙️ Commentary
    const commentary = generateAdvancedCommentary(event, syncedState);
    console.log("🎙️ GENERATED:", commentary);

    addCommentary(matchId, commentary);

    // 📊 Update simulation stats
    updateState(state, event);

    // ✅ Update over tracker
    state.over = over;

    // 🎯 Target chase stop
    if (state.target && state.totalRuns >= state.target) {
      console.log("🎉 Target chased!");
      stopSimulation();
      return;
    }

    // 🔁 Next ball (REALISTIC DELAY)
    const delay = Math.random() * 800 + 1200;

    interval = setTimeout(runBall, delay);
  };

  // ▶ Start first ball
  runBall();
}

export function stopSimulation() {
  if (interval) {
    clearTimeout(interval);
    interval = null;
    console.log("⏹ Simulation stopped");
  }
}

/* ============================= */

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