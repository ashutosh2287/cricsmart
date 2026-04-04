import { BallEvent } from "@/types/ballEvent";
import { EngineBallEvent } from "@/services/matchEngine";

type StrictBallEvent = BallEvent & {
  battingTeam: string;
  bowlingTeam: string;
};
export function toEngineEvent(event: StrictBallEvent): EngineBallEvent {

  

  if (!event.battingTeam || !event.bowlingTeam) {
    throw new Error("❌ Missing team info in event (Simulator must provide this)");
  }

  // 🔥 GENERATE UNIQUE ID + TIMESTAMP
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const timestamp = Date.now();

  const base = {
    id,
    timestamp,

    batsman: event.batsman,
    nonStriker: event.nonStriker!,
    bowler: event.bowler,

    battingTeam: event.battingTeam,
    bowlingTeam: event.bowlingTeam
  };

  switch (event.type) {
    case "RUN":
      return { type: "RUN", runs: event.runs, ...base };

    case "FOUR":
      return { type: "FOUR", ...base };

    case "SIX":
      return { type: "SIX", ...base };

    case "WICKET":
      return { type: "WICKET", ...base };

    case "WD":
      return { type: "WD", ...base };

    case "NB":
      return { type: "NB", ...base };

    case "BYE":
      return { type: "BYE", runs: event.runs, ...base };

    case "LB":
      return { type: "LB", runs: event.runs, ...base };

    default:
      throw new Error("❌ Invalid event type");
  }
}