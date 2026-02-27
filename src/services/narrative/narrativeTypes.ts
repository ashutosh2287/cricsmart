export type NarrativeArc =
  | "NORMAL"
  | "PRESSURE_BUILD"
  | "MOMENTUM_SWING"
  | "COLLAPSE"
  | "COMEBACK"
  | "CLIMAX";

export type NarrativeState = {
  matchId: string;
  branchId: string;

  currentArc: NarrativeArc;

  pressureScore: number;
  momentumScore: number;

  lastEventId?: string;
  arcStartEventId?: string;
};