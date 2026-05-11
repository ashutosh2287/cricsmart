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

  const raw = String(apiEvent.type ?? "RUN").toUpperCase();

  if (raw === "WD" || raw === "WIDE") return "WD";
  if (raw === "NB" || raw === "NOBALL" || raw === "NO_BALL") return "NB";
  if (raw === "BYE" || raw === "BYES") return "BYE";
  if (raw === "LB" || raw === "LEG_BYE" || raw === "LEGBYE") return "LB";

  if (apiEvent.runs === 4) return "FOUR";
  if (apiEvent.runs === 6) return "SIX";

  return "RUN";
}

function normalizeDismissal(
  apiEvent: ApiBallEvent,
  striker: string
): "BOWLED" | "CAUGHT" | "RUN_OUT_STRIKER" | "RUN_OUT_NON_STRIKER" {
  const text = String(apiEvent.dismissal ?? "").toLowerCase();

  if (text.includes("run")) {
    if (apiEvent.batsman?.trim() === striker.trim()) {
      return "RUN_OUT_STRIKER";
    }
    return "RUN_OUT_NON_STRIKER";
  }

  if (text.includes("catch")) {
    return "CAUGHT";
  }

  return "BOWLED";
}

function isFiniteAndNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
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

  if (!batsman || !other || !bowler) {
    return null;
  }

  const eventType = normalizeType(apiEvent);
  const timestamp = Number.isFinite(apiEvent.timestamp)
    ? apiEvent.timestamp
    : Date.now();

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
        runs: apiEvent.runs ?? 0,
        dismissalKind: normalizeDismissal(apiEvent, striker),
      };
    case "WD":
      return {
        ...common,
        type: "WD",
        runs: apiEvent.runs > 0 ? apiEvent.runs : 1,
      };
    case "NB":
      return {
        ...common,
        type: "NB",
        runs: apiEvent.runs > 0 ? apiEvent.runs : 1,
      };
    case "BYE":
      return {
        ...common,
        type: "BYE",
        runs: apiEvent.runs,
      };
    case "LB":
      return {
        ...common,
        type: "LB",
        runs: apiEvent.runs,
      };
    case "FOUR":
      return {
        ...common,
        type: "FOUR",
        runs: 4,
      };
    case "SIX":
      return {
        ...common,
        type: "SIX",
        runs: 6,
      };
    default:
      return {
        ...common,
        type: "RUN",
        runs: apiEvent.runs,
      };
  }
}
