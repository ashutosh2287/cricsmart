export type BallEvent = {

  id: string;
  slug: string;

  over: number;
  runs: number;

  wicket?: boolean;
  extra?: boolean;

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
    | "NB";

  timestamp: number;

  isLegalDelivery?: boolean;

  valid: boolean;
  replacedBy?: string;

  branchId?: string;
};