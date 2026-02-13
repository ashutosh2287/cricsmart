import { Match } from "./match";

export type RealtimeEvent =
  | {
      type: "match_update";
      payload: Match;
    }
  | {
      type: "commentary_update";
      payload: string[];
    };
