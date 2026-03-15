import { ApiBallEvent } from "../api/cricketApiService";
import { EngineBallEvent } from "../matchEngine";

export function adaptApiEventToEngineEvent(
  apiEvent: ApiBallEvent
): EngineBallEvent {

  const basePlayers = {
    batsman: apiEvent.batsman,
    nonStriker: "Unknown",
    bowler: apiEvent.bowler
  };

  if (apiEvent.wicket) {
    return {
      type: "WICKET",
      ...basePlayers
    };
  }

  if (apiEvent.runs === 6) {
    return {
      type: "SIX",
      ...basePlayers
    };
  }

  if (apiEvent.runs === 4) {
    return {
      type: "FOUR",
      ...basePlayers
    };
  }

  return {
    type: "RUN",
    runs: apiEvent.runs,
    ...basePlayers
  };
}