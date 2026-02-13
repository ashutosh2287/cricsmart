// src/services/matchStateMachine.ts

// STEP 1 — Types
export type MatchState =
  | "PRE_MATCH"
  | "LIVE"
  | "OVER_BREAK"
  | "INNINGS_BREAK"
  | "FINISHED"

export type MatchEvent =
  | "START_MATCH"
  | "BALL"
  | "OVER_COMPLETE"
  | "INNINGS_END"
  | "MATCH_END"


// STEP 2 — State transition logic
export function nextMatchState(
  current: MatchState,
  event: MatchEvent
): MatchState {

  switch (event) {

    case "START_MATCH":
      return "LIVE"

    case "OVER_COMPLETE":
      return "OVER_BREAK"

    case "BALL":
      return "LIVE"

    case "INNINGS_END":
      return "INNINGS_BREAK"

    case "MATCH_END":
      return "FINISHED"

    default:
      return current
  }
}
