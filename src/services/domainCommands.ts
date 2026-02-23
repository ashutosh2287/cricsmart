import { BallEvent } from "@/types/ballEvent";
export type DomainCommand =
  | { type: "SCORE_RUN"; slug: string; runs: number }
  | { type: "SCORE_FOUR"; slug: string }
  | { type: "SCORE_SIX"; slug: string }
  | { type: "SCORE_WICKET"; slug: string }
  | { type: "SCORE_WIDE"; slug: string }
  | { type: "SCORE_NOBALL"; slug: string }

  // ⭐ NEW — correction commands
  | { type: "UNDO_LAST_BALL"; slug: string }
  | { type: "DELETE_BALL_EVENT"; slug: string; eventId: string }
  | { type: "REPLACE_BALL_EVENT"; slug: string; eventId: string; replacement: Partial<BallEvent> };