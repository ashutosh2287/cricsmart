export type DomainCommand =
  | { type: "SCORE_RUN"; slug: string; runs: number }
  | { type: "SCORE_FOUR"; slug: string }
  | { type: "SCORE_SIX"; slug: string }
  | { type: "SCORE_WICKET"; slug: string }
  | { type: "SCORE_WIDE"; slug: string }
  | { type: "SCORE_NOBALL"; slug: string };