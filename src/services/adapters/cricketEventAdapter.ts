import { ApiBallEvent } from "../api/cricketApiService";
import { EngineBallEvent } from "../matchEngine";
import { resolvePlayerName } from "../player/playerRegistry";

function normalizeType(apiEvent: ApiBallEvent):
  | "RUN"
  | "WICKET"
  | "WD"
  | "NB"
  | "BYE"
  | "LB"
  | "FOUR"
  | "SIX" {
  if (apiEvent.wicket) return "WICKET";

  const raw = String(apiEvent.type ?? "RUN").toUpperCase().replace(/\s+/g, "_");

  if (raw.includes("WD") || raw.includes("WIDE")) return "WD";
  if (raw.includes("NB") || raw.includes("NO_BALL") || raw.includes("NOBALL")) return "NB";
  if (raw.includes("LEG_BYE") || raw.includes("LEGBYE") || raw === "LB") return "LB";
  if (raw.includes("BYE")) return "BYE";
  if (apiEvent.runs === 4) return "FOUR";
  if (apiEvent.runs === 6) return "SIX";

  return "RUN";
}

function normalizeDismissal(
  apiEvent: ApiBallEvent,
  striker: string
): "BOWLED" | "CAUGHT" | "RUN_OUT_STRIKER" | "RUN_OUT_NON_STRIKER" {
  const text = String(apiEvent.dismissal ?? apiEvent.type ?? "").toLowerCase();

  if (text.includes("run")) {
    if (apiEvent.batsman?.trim().toLowerCase() === striker.trim().toLowerCase()) {
      return "RUN_OUT_STRIKER";
    }
    return "RUN_OUT_NON_STRIKER";
  }

  if (text.includes("catch") || text.includes("stump")) {
    return "CAUGHT";
  }

  return "BOWLED";
}

function isFiniteAndNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function resolveRuns(apiEvent: ApiBallEvent, eventType: ReturnType<typeof normalizeType>) {
  const runs = Math.max(0, Number(apiEvent.runs ?? 0));

  if (eventType === "WD" || eventType === "NB") {
    return runs > 0 ? runs : 1;
  }

  if (eventType === "FOUR") return 4;
  if (eventType === "SIX") return 6;
  return runs;
}

export function adaptApiEventToEngineEvent(
  matchId: string,
  apiEvent: ApiBallEvent,
  striker: string,
  nonStriker: string,
  battingTeam: string,
  bowlingTeam: string
): EngineBallEvent | null {
  if (!apiEvent) return null;

  if (
    !isFiniteAndNonNegative(apiEvent.innings) ||
    !isFiniteAndNonNegative(apiEvent.over) ||
    !isFiniteAndNonNegative(apiEvent.ball) ||
    !isFiniteAndNonNegative(apiEvent.runs)
  ) {
    return null;
  }

  const engineStriker = resolvePlayerName(matchId, striker);
  const engineNonStriker = resolvePlayerName(matchId, nonStriker);

  const providerStriker = apiEvent.batsman
    ? resolvePlayerName(matchId, apiEvent.batsman)
    : "";
  const providerNonStriker = apiEvent.nonStriker
    ? resolvePlayerName(matchId, apiEvent.nonStriker)
    : "";

  const batsman = providerStriker || engineStriker;
  const other = providerNonStriker || engineNonStriker;
  const bowler = resolvePlayerName(matchId, apiEvent.bowler);

  if (!batsman || !other || !bowler || !battingTeam || !bowlingTeam) {
    return null;
  }

  const eventType = normalizeType(apiEvent);
  const timestamp = Number.isFinite(apiEvent.timestamp)
    ? apiEvent.timestamp
    : Date.now();
  const runs = resolveRuns(apiEvent, eventType);

  const common = {
    id: apiEvent.id,
    batsman,
    nonStriker: other,
    bowler,
    battingTeam,
    bowlingTeam,
    over: apiEvent.over,
    ball: apiEvent.ball,
    timestamp,
  };

  switch (eventType) {
    case "WICKET":
      return {
        ...common,
        type: "WICKET",
        runs,
        dismissalKind: normalizeDismissal(apiEvent, striker),
      };
    case "WD":
      return {
        ...common,
        type: "WD",
        runs,
      };
    case "NB":
      return {
        ...common,
        type: "NB",
        runs,
      };
    case "BYE":
      return {
        ...common,
        type: "BYE",
        runs,
      };
    case "LB":
      return {
        ...common,
        type: "LB",
        runs,
      };
    case "FOUR":
      return {
        ...common,
        type: "FOUR",
        runs,
      };
    case "SIX":
      return {
        ...common,
        type: "SIX",
        runs,
      };
    default:
      return {
        ...common,
        type: "RUN",
        runs,
      };
  }
}
