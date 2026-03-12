import { EngineBallEvent } from "./matchEngine";
type PlayerFields = {
  batsman: string;
  nonStriker: string;
  bowler: string;
};

export type DomainCommand =
  | ({ type: "SCORE_RUN"; slug: string; runs: number } & PlayerFields)
  | ({ type: "SCORE_FOUR"; slug: string } & PlayerFields)
  | ({ type: "SCORE_SIX"; slug: string } & PlayerFields)
  | ({ type: "SCORE_WICKET"; slug: string } & PlayerFields)
  | ({ type: "SCORE_WIDE"; slug: string } & PlayerFields)
  | ({ type: "SCORE_NOBALL"; slug: string } & PlayerFields)
  | { type: "UNDO_LAST_BALL"; slug: string }
  | { type: "DELETE_BALL_EVENT"; slug: string; eventId: string }
  | {
      type: "REPLACE_BALL_EVENT";
      slug: string;
      eventId: string;
      replacement: EngineBallEvent;
    };