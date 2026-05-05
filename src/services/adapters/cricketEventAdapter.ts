import { ApiBallEvent } from "../api/cricketApiService";
import { EngineBallEvent } from "../matchEngine";
import { resolvePlayerName } from "../player/playerRegistry";

// 🔧 Temporary simple normalizer (we'll upgrade later)


export function adaptApiEventToEngineEvent(
  matchId: string,
  apiEvent: ApiBallEvent,
  striker: string,
  nonStriker: string,
  battingTeam: string,
  bowlingTeam: string
): EngineBallEvent | null {
  if (!apiEvent) return null;

  // 🧠 Normalize players (IMPORTANT)
  // 🔥 PLAYER RESOLUTION (SMART LAYER)

// API gives batsman sometimes (depends on provider)
const apiBatsman = apiEvent.batsman
  ? resolvePlayerName(matchId, apiEvent.batsman)
  : null;

// Engine fallback (always valid)
const engineStriker = resolvePlayerName(striker);
const engineNonStriker = resolvePlayerName(nonStriker);

// FINAL SELECTION
// 🔥 TRUST API BATSMAN FOR REALISM
const batsman = apiBatsman || engineStriker;

// 🔥 detect if striker mismatch
if (apiBatsman && apiBatsman !== engineStriker) {
  console.warn("⚠️ Striker mismatch detected:", apiBatsman, engineStriker);
}
const other = engineNonStriker;

// Bowler (API is usually correct)
const bowler = resolvePlayerName(apiEvent.bowler);

  // 🧠 Extract meta (MUST EXIST ideally)
  const over = apiEvent.over;
  const ball = apiEvent.ball;
  const timestamp = Date.now();

  // ⚠️ Guard: reject bad events early
  // 🔥 STRICT EVENT ORDER VALIDATION
if (over < 0 || ball < 0) {
  console.warn("❌ Invalid over/ball values", apiEvent);
  return null;
}

  // 🏏 WICKET
  if (apiEvent.wicket) {
  let dismissalKind: "BOWLED" | "CAUGHT" | "RUN_OUT_STRIKER" | "RUN_OUT_NON_STRIKER" = "BOWLED";

  if (apiEvent.dismissal?.toLowerCase().includes("run")) {
    dismissalKind =
      apiEvent.batsman === striker
        ? "RUN_OUT_STRIKER"
        : "RUN_OUT_NON_STRIKER";
  }

  return {
    type: "WICKET",
    runs: apiEvent.runs ?? 0,
    batsman,
    nonStriker: other,
    bowler,
    battingTeam,
    bowlingTeam,
    over,
    ball,
    timestamp,
    dismissalKind,
  };
}

  // 🎯 WIDE
  if (apiEvent.type === "WD") {
    return {
      type: "WD",
      runs: apiEvent.runs ?? 1,
      batsman,
      nonStriker: other,
      bowler,
      battingTeam,
      bowlingTeam,
      over,
      ball,
      timestamp,
    };
  }

  // 🎯 NO BALL
  if (apiEvent.type === "NB") {
    return {
      type: "NB",
      runs: apiEvent.runs ?? 1,
      batsman,
      nonStriker: other,
      bowler,
      battingTeam,
      bowlingTeam,
      over,
      ball,
      timestamp,
    };
  }

  // 💥 FOUR
  if (apiEvent.runs === 4) {
    return {
      type: "FOUR",
      runs: 4,
      batsman,
      nonStriker: other,
      bowler,
      battingTeam,
      bowlingTeam,
      over,
      ball,
      timestamp,
    };
  }

  // 💥 SIX
  if (apiEvent.runs === 6) {
    return {
      type: "SIX",
      runs: 6,
      batsman,
      nonStriker: other,
      bowler,
      battingTeam,
      bowlingTeam,
      over,
      ball,
      timestamp,
    };
  }

  // 🏃 RUN / DOT
  const runs = apiEvent.runs;

  if (runs == null) {
    console.warn("❌ Missing runs in API event", apiEvent);
    return null;
  }

  return {
    type: "RUN",
    runs,
    batsman,
    nonStriker: other,
    bowler,
    battingTeam,
    bowlingTeam,
    over,
    ball,
    timestamp,
  };
}