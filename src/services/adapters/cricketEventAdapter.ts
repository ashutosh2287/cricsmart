import { ApiBallEvent } from "../api/cricketApiService";
import { EngineBallEvent } from "../matchEngine";

export function adaptApiEventToEngineEvent(
  apiEvent: ApiBallEvent,
  matchSlug: string,
  nonStriker: string
): EngineBallEvent {

  const batsman = apiEvent.batsman ?? "";
  const bowler = apiEvent.bowler ?? "";

  if (apiEvent.wicket) {
    return {
      type: "WICKET",
      batsman,
      nonStriker,
      bowler
    };
  }

  if (apiEvent.type === "WD") {
    return {
      type: "WD",
      batsman,
      nonStriker,
      bowler
    };
  }

  if (apiEvent.type === "NB") {
    return {
      type: "NB",
      batsman,
      nonStriker,
      bowler
    };
  }

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

  return {
    type: "RUN",
    runs: apiEvent.runs ?? 1,
    batsman,
    nonStriker,
    bowler
  };
}