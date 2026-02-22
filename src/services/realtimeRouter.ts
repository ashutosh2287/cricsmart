import { enqueueBallEvent } from "@/services/eventQueue";

export type RealtimeBallEvent =
  | { type: "RUN"; matchId: string; runs: number }
  | { type: "FOUR"; matchId: string }
  | { type: "SIX"; matchId: string }
  | { type: "WICKET"; matchId: string }
  | { type: "WD"; matchId: string }
  | { type: "NB"; matchId: string };

export function routeRealtimeEvent(data: RealtimeBallEvent) {

  switch (data.type) {

    case "RUN":
      enqueueBallEvent(data.matchId, {
        type: "RUN",
        runs: data.runs
      });
      break;

    case "FOUR":
      enqueueBallEvent(data.matchId, { type: "FOUR" });
      break;

    case "SIX":
      enqueueBallEvent(data.matchId, { type: "SIX" });
      break;

    case "WICKET":
      enqueueBallEvent(data.matchId, { type: "WICKET" });
      break;

    case "WD":
      enqueueBallEvent(data.matchId, { type: "WD" });
      break;

    case "NB":
      enqueueBallEvent(data.matchId, { type: "NB" });
      break;
  }

}