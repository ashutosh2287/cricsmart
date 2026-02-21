export type BallEvent = {

  slug: string;

  over: number;

  runs: number;

  wicket?: boolean;

  // ⭐ NEW (for WD / NB support)
  extra?: boolean;

  // ⭐ OPTIONAL (future-ready)
  type?: "RUN" | "FOUR" | "SIX" | "WICKET" | "WD" | "NB";

  timestamp: number; 
  isLegalDelivery?: boolean;

};
