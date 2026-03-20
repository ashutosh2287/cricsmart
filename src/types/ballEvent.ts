export type BallEvent = {

  id: string;
  slug: string;

  over: number;
  runs: number;

  wicket?: boolean;
  extra?: boolean;

  // ⭐ NEW (IMPORTANT)
  extraType?: "WD" | "NB" | "BYE" | "LB";
  extraRuns?: number;

  // ⭐ ADD THIS (VERY IMPORTANT)
  totalRuns?: number;

  // ⭐ PLAYER INFORMATION
  batsman: string;
  nonStriker?: string;
  bowler: string;

  // ⭐ EVENT TYPE
  type:
    | "RUN"
    | "FOUR"
    | "SIX"
    | "WICKET"
    | "WD"
    | "NB"
    | "BYE"
    | "LB";

  timestamp: number;

  isLegalDelivery?: boolean;

  valid: boolean;
  replacedBy?: string;

  branchId?: string;
};