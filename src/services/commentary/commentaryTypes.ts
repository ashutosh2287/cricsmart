export type CommentaryTone =
  | "CALM"
  | "NEUTRAL"
  | "AGGRESSIVE";

export type CommentaryEvent = {
  matchId: string;
  branchId: string;
  eventId: string;
  text: string;
  tone: CommentaryTone;
};