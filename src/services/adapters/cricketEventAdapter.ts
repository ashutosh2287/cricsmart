import { ApiBallEvent } from "../api/cricketApiService";
import { EngineBallEvent } from "../matchEngine";

export function adaptApiEventToEngineEvent(
  apiEvent: ApiBallEvent,
  matchSlug: string,
  nonStriker: string
): EngineBallEvent | null {

  if (!apiEvent) return null;

  const batsman = apiEvent.batsman ?? "Unknown";
  const bowler = apiEvent.bowler ?? "Unknown";

  // 🏏 1. WICKET
  if (apiEvent.wicket) {
    return {
      type: "WICKET",
      batsman,
      nonStriker,
      bowler
    };
  }

  // 🎯 2. WIDE
  if (apiEvent.type === "WD") {
    return {
      type: "WD",
      batsman,
      nonStriker,
      bowler
    };
  }

  // 🎯 3. NO BALL
  if (apiEvent.type === "NB") {
    return {
      type: "NB",
      batsman,
      nonStriker,
      bowler
    };
  }

  // 💥 4. BOUNDARIES
  if (apiEvent.runs === 4) {
    return {
      type: "FOUR",
      batsman,
      nonStriker,
      bowler
    };
  }

  if (apiEvent.runs === 6) {
    return {
      type: "SIX",
      batsman,
      nonStriker,
      bowler
    };
  }

  // 🏃 5. RUN / DOT (ENGINE SAFE)
  return {
    type: "RUN",
    runs: apiEvent.runs ?? 0,
    batsman,
    nonStriker,
    bowler
  };
}