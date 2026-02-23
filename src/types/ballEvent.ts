export type BallEvent = {

  id: string;

  slug: string;

  over: number;

  runs: number;

  wicket?: boolean;

  extra?: boolean;

  // ⭐ ONLY REAL CRICKET EVENTS
  type:
    | "RUN"
    | "FOUR"
    | "SIX"
    | "WICKET"
    | "WD"
    | "NB";

  timestamp: number;

  isLegalDelivery?: boolean;

  // ⭐ correction metadata
  valid: boolean;
  replacedBy?: string;

  // ⭐ temporal branch support
  branchId?: string;
};