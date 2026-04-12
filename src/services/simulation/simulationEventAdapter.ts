import { BallEvent } from "@/types/ballEvent";
import { EngineBallEvent } from "@/services/matchEngine";

type StrictBallEvent = BallEvent & {
  battingTeam: string;
  bowlingTeam: string;
};

function assertRequiredFields(event: StrictBallEvent): void {
  if (!event.battingTeam || !event.bowlingTeam) {
    throw new Error("❌ Missing team info in event");
  }

  if (!event.batsman || !event.nonStriker || !event.bowler) {
    throw new Error("❌ Missing player info in event");
  }
}

function assertNever(x: never): never {
  throw new Error("❌ Unhandled event variant");
}

export function toEngineEvent(event: StrictBallEvent): EngineBallEvent {
  assertRequiredFields(event);

  const id = event.id;

  const base = {
    id,
    batsman: event.batsman,
    nonStriker: event.nonStriker,
    bowler: event.bowler,
    battingTeam: event.battingTeam,
    bowlingTeam: event.bowlingTeam
  };

  console.log("ADAPTER EVENT CHECK", {
  type: event.type,
  batsman: event.batsman,
  nonStriker: event.nonStriker,
  bowler: event.bowler,
  battingTeam: event.battingTeam,
  bowlingTeam: event.bowlingTeam
});

  switch (event.type) {
    case "RUN":
      return {
        type: "RUN",
        runs: event.runs,
        ...base
      };

    case "FOUR":
      return {
        type: "FOUR",
        ...base
      };

    case "SIX":
      return {
        type: "SIX",
        ...base
      };

    case "WICKET":
      return {
        type: "WICKET",
        ...base
      };

    case "WD":
      return {
        type: "WD",
        ...base
      };

    case "NB":
      return {
        type: "NB",
        ...base
      };

    case "BYE":
      return {
        type: "BYE",
        runs: event.extraRuns,
        ...base
      };

    case "LB":
      return {
        type: "LB",
        runs: event.extraRuns,
        ...base
      };

    default:
      return assertNever(event);
  }
}