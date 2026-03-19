import { BallEvent } from "@/types/ballEvent";
import { EngineBallEvent } from "../matchEngine";

export function toEngineEvent(event: BallEvent): EngineBallEvent {
  if (event.type === "RUN") {
    return {
      type: "RUN",
      runs: event.runs,
      batsman: event.batsman,
      nonStriker: event.nonStriker!,
      bowler: event.bowler,
    };
  }

  if (event.type === "FOUR") {
    return {
      type: "FOUR",
      batsman: event.batsman,
      nonStriker: event.nonStriker!,
      bowler: event.bowler,
    };
  }

  if (event.type === "SIX") {
    return {
      type: "SIX",
      batsman: event.batsman,
      nonStriker: event.nonStriker!,
      bowler: event.bowler,
    };
  }

  if (event.type === "WICKET") {
    return {
      type: "WICKET",
      batsman: event.batsman,
      nonStriker: event.nonStriker!,
      bowler: event.bowler,
    };
  }

  if (event.type === "WD") {
    return {
      type: "WD",
      batsman: event.batsman,
      nonStriker: event.nonStriker!,
      bowler: event.bowler,
    };
  }

  if (event.type === "NB") {
    return {
      type: "NB",
      batsman: event.batsman,
      nonStriker: event.nonStriker!,
      bowler: event.bowler,
    };
  }

  throw new Error("Invalid event type");
}