import { BallEvent } from "@/types/ballEvent";
import { EngineBallEvent } from "@/services/matchEngine";

type StrictBallEvent = BallEvent & {
  battingTeam: string;
  bowlingTeam: string;
};

function assertRequiredFields(event: StrictBallEvent): void {
  const battingTeam = event.battingTeam?.trim() ?? "";
  const bowlingTeam = event.bowlingTeam?.trim() ?? "";
  const batsman = event.batsman?.trim() ?? "";
  const nonStriker = event.nonStriker?.trim() ?? "";
  const bowler = event.bowler?.trim() ?? "";

  if (!battingTeam || !bowlingTeam) {
    throw new Error("❌ Missing team info in simulationEventAdapter");
  }

  if (battingTeam === bowlingTeam) {
    throw new Error(
      `❌ Invalid simulation teams in adapter: battingTeam and bowlingTeam are the same (${battingTeam})`
    );
  }

  if (!bowler) {
    throw new Error("❌ Missing bowler info in simulationEventAdapter");
  }

  // Batter names are optional adapter hints.
  // If provided, they must be complete and valid.
  if ((batsman && !nonStriker) || (!batsman && nonStriker)) {
    throw new Error("❌ Incomplete batter info in simulationEventAdapter");
  }

  if (batsman && nonStriker && batsman === nonStriker) {
    throw new Error(
      `❌ Invalid batting pair in adapter: striker and non-striker are the same player (${batsman})`
    );
  }
}

function assertNever(_: never): never {
  throw new Error("❌ Unhandled event variant");
}

export function toEngineEvent(event: StrictBallEvent): EngineBallEvent {
  assertRequiredFields(event);

  const id = String(event.id ?? "").trim();
  if (!id) {
    throw new Error("❌ Missing event id");
  }

  const batsman = event.batsman?.trim() ?? "";
  const nonStriker = event.nonStriker?.trim() ?? "";
  const bowler = event.bowler.trim();
  const battingTeam = event.battingTeam.trim();
  const bowlingTeam = event.bowlingTeam.trim();

  const base = {
  id,
  batsman,
  nonStriker,
  bowler,
  battingTeam,
  bowlingTeam,
};

  console.log("ADAPTER EVENT CHECK", {
    id,
    type: event.type,
    hasBattingPair: !!(batsman && nonStriker),
    batsman,
    nonStriker,
    bowler,
    battingTeam,
    bowlingTeam,
  });

  switch (event.type) {
    case "RUN": {
      if (typeof event.runs !== "number") {
        throw new Error("❌ RUN event missing numeric runs");
      }

      return {
        type: "RUN",
        runs: event.runs,
        ...base,
      };
    }

    case "FOUR":
      return {
        type: "FOUR",
        ...base,
      };

    case "SIX":
      return {
        type: "SIX",
        ...base,
      };

    case "WICKET":
      return {
        type: "WICKET",
        ...base,
      };

    case "WD":
      return {
        type: "WD",
        ...base,
      };

    case "NB":
      return {
        type: "NB",
        ...base,
      };

    case "BYE": {
      const runs = typeof event.extraRuns === "number" ? event.extraRuns : 0;
      return {
        type: "BYE",
        runs,
        ...base,
      };
    }

    case "LB": {
      const runs = typeof event.extraRuns === "number" ? event.extraRuns : 0;
      return {
        type: "LB",
        runs,
        ...base,
      };
    }

    default:
      return assertNever(event);
  }
}