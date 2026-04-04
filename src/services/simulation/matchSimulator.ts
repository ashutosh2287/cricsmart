import { generateBallEvent } from "./ballGenerator";
import { SimulationState } from "./simulationState";
import { BallEvent } from "@/types/ballEvent";
import { dispatchBallEvent, getMatchState } from "../matchEngine";
import { toEngineEvent } from "./simulationEventAdapter";
import { addCommentary } from "../commentary/commentaryStore";
import { generateAdvancedCommentary } from "../commentary/advancedCommentaryEngine";
import { getBattingOrder } from "../teams/battingOrder";
import {  Team } from "@/data/teams";
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
      plan.push(bowlingOrder[0]); // fallback
    }
  }

  return plan;
}

function startSecondInnings(state: SimulationState) {
  console.log("🔄 Starting 2nd innings (CLEAN)");

  const teamA = state.teamA;
  const teamB = state.teamB;

  let firstBattingTeam;
  let secondBattingTeam;


  // 🧠 Recalculate based on toss
  if (state.tossWinner === teamA.name) {
    if (state.decision === "BAT") {
      firstBattingTeam = teamA;
      secondBattingTeam = teamB;
    } else {
      firstBattingTeam = teamB;
      secondBattingTeam = teamA;
    }
  } else {
    if (state.decision === "BAT") {
      firstBattingTeam = teamB;
      secondBattingTeam = teamA;
    } else {
      firstBattingTeam = teamA;
      secondBattingTeam = teamB;
    }
  }
  // ✅ SET TEAMS FOR SECOND INNINGS (SOURCE OF TRUTH)
state.battingTeam = secondBattingTeam;
state.bowlingTeam = firstBattingTeam;

console.log("✅ 2nd innings teams:", {
  batting: state.battingTeam.name,
  bowling: state.bowlingTeam.name
});

  // ✅ NOW 2ND INNINGS TEAM
  const battingXI = getPlayingXI(secondBattingTeam).players;
  const bowlingXI = getPlayingXI(firstBattingTeam).players;

  state.battingOrder = getBattingOrder(battingXI);
  state.bowlingOrder = getBowlingOrder(bowlingXI);

  state.bowlingPlan = createBowlingPlan(state.bowlingOrder);

  // ✅ Reset core state
  state.striker = state.battingOrder[0];
  state.nonStriker = state.battingOrder[1];
  state.nextBatsmanIndex = 2;

  state.currentBowlerIndex = 0;
  state.bowler = state.bowlingOrder[0];

  state.over = 0;
  state.ball = 0;
  state.totalRuns = 0;
  state.wickets = 0;

  state.lastOverUpdated = -1;

  console.log("✅ 2nd innings setup complete");
}

export function startSimulation(
  state: SimulationState,
  matchId: string,
  speed: number = 1500
) {
  const matchState = getMatchState(matchId);
  if (!matchState) return;

  // 🔥 FORCE CLEAN START
  state.currentInningsIndex = 0;
  matchState.currentInningsIndex = 0;

  console.log("🚀 Starting with innings index:", state.currentInningsIndex);
  console.log("🚀 Engine innings index:", matchState.currentInningsIndex);

  // 🔥 SYNC ENGINE STATE
  matchState.teamA = state.teamA;
  matchState.teamB = state.teamB;
  matchState.tossWinner = state.tossWinner;
  matchState.decision = state.decision;

  if (isRunning) {
    console.log("⚠️ Simulation already running");
    return;
  }

  stopSimulation();

  isRunning = true;
  isPaused = false;
  currentSpeed = speed;

  /* =====================================================
     🔒 STEP 1: ALWAYS INIT TEAMS (FIRST INNINGS)
  ===================================================== */

  if (!state.battingTeam || !state.bowlingTeam) {
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

    state.battingTeam = battingTeam;
    state.bowlingTeam = bowlingTeam;

    console.log("✅ First innings teams initialized");
  }

  /* =====================================================
     🏏 STEP 2: SET PLAYING XI + ORDERS
  ===================================================== */

  if (!state.battingOrder || state.battingOrder.length === 0) {
    console.log("🏏 Setting Playing XI + Batting Order");

    const battingXI = getPlayingXI(state.battingTeam).players;
    const bowlingXI = getPlayingXI(state.bowlingTeam).players;

    state.battingOrder = getBattingOrder(battingXI);
    state.bowlingOrder = getBowlingOrder(bowlingXI);

    state.striker = state.battingOrder[0];
    state.nonStriker = state.battingOrder[1];
    state.nextBatsmanIndex = 2;

    state.currentBowlerIndex = 0;
    state.bowler = state.bowlingOrder[0];

    console.log("🧠 Batting Order:", state.battingOrder);
  }

  /* =====================================================
     🎯 STEP 3: BOWLING PLAN
  ===================================================== */

  if (!state.bowlingPlan || state.bowlingPlan.length === 0) {
    state.bowlingPlan = createBowlingPlan(state.bowlingOrder);
    console.log("📋 Bowling Plan:", state.bowlingPlan);
  }

  /* =====================================================
     🔁 MAIN LOOP
  ===================================================== */

  const runBall = () => {
    if (!isRunning) return;

    if (isPaused) {
      timeoutRef = setTimeout(runBall, 500);
      return;
    }

    const matchState = getMatchState(matchId);
    if (!matchState) return;

    // 🛑 Prevent invalid innings
    if (matchState.currentInningsIndex >= 2) {
      console.log("🛑 Prevented invalid innings");
      stopSimulation();
      return;
    }

    const index = matchState.currentInningsIndex;
    const innings = matchState.innings[index];

    if (!innings) return;

    /* =============================
       🏁 INNINGS COMPLETE
    ============================= */

    if (innings.completed) {
      if (index === 0) {
        console.log("🔄 Switching to 2nd innings");

        matchState.currentInningsIndex = 1;

        const first = matchState.innings[0];
        state.target = first.runs + 1;

        startSecondInnings(state);
        // 🔥 FORCE ENGINE SYNC (VERY IMPORTANT)
matchState.innings[1].battingTeam = state.battingTeam.name;
matchState.innings[1].bowlingTeam = state.bowlingTeam.name;

        console.log("🔥 AFTER SWITCH:", {
  batting: state.battingTeam?.name,
  bowling: state.bowlingTeam?.name
});

        if (!matchState.innings[1]) {
          matchState.innings.push({
            runs: 0,
            wickets: 0,
            over: 0,
            ball: 0,
            overs: {},
            completed: false,
            striker: "",
            nonStriker: "",
            battingTeam: "",
            bowlingTeam: "",
            bowlingStats: {}
          });
        }

        setTimeout(() => {
  runBall();
}, currentSpeed);

        return;
      }

      if (index === 1) {
        console.log("🏆 Match finished");
        finishMatch(state, matchState);
        stopSimulation();
        return;
      }
    }

    /* =============================
       🎯 NORMAL BALL
    ============================= */

    const over = Math.floor(innings.over);

    if (state.bowlingPlan && state.bowlingPlan[over]) {
      state.bowler = state.bowlingPlan[over];
    }

   // ✅ ALWAYS SYNC FROM ENGINE (SOURCE OF TRUTH)
const engineBattingTeam = innings.battingTeam;
const engineBowlingTeam = innings.bowlingTeam;

// 🔥 FORCE SYNC BACK TO SIMULATION STATE
if (engineBattingTeam && engineBowlingTeam) {
  state.battingTeam = {
    ...state.battingTeam,
    name: engineBattingTeam
  };

  state.bowlingTeam = {
    ...state.bowlingTeam,
    name: engineBowlingTeam
  };
}

// ✅ CREATE CLEAN SYNCED STATE
const syncedState: SimulationState = {
  ...state,
  over: innings.over,
  ball: innings.ball,
  phase:
    over < 6 ? "POWERPLAY" :
    over < 15 ? "MIDDLE" : "DEATH"
};

    const event: BallEvent = generateBallEvent(syncedState);
    console.log("🎯 CURRENT TEAMS:", {
  innings: getMatchState(matchId)?.currentInningsIndex,
  batting: state.battingTeam?.name,
  bowling: state.bowlingTeam?.name
});
    if (!event) return;

    // 🔒 FINAL SAFETY (optional)
    if (!state.battingTeam || !state.bowlingTeam) {
      console.error("❌ Teams missing");
      stopSimulation();
      return;
    }

    const engineEvent = toEngineEvent({
  ...event,
  batsman: syncedState.striker,
  nonStriker: syncedState.nonStriker,
  bowler: state.bowler,

  // 🔥 ALWAYS USE ENGINE TEAMS (NOT STATE)
  battingTeam: engineBattingTeam || state.battingTeam.name,
  bowlingTeam: engineBowlingTeam || state.bowlingTeam.name
});

    dispatchBallEvent(matchId, engineEvent);

    const commentary = generateAdvancedCommentary(event, {
      ...matchState,
      ...syncedState
    });

    addCommentary(matchId, commentary);

    updateState(state, event);

    state.over = innings.over;
    state.ball = innings.ball;

    /* =============================
       🎯 TARGET CHASE
    ============================= */

    if (state.target && state.totalRuns >= state.target) {
      console.log("🎉 Target chased");
      finishMatch(state, matchState);
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