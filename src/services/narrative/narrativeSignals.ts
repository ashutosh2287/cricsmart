export type NarrativeSignal =
  // =========================================
  // ARC SYSTEM (KEEP EXISTING)
  // =========================================
  | {
      type: "ARC_STARTED";
      matchId: string;
      branchId: string;
      arc: string;
      eventId: string;
    }
  | {
      type: "ARC_ESCALATED";
      matchId: string;
      branchId: string;
      arc: string;
      eventId: string;
    }

  // =========================================
  // REAL MATCH SIGNALS (NEW 🔥)
  // =========================================

  | {
      type: "COLLAPSE";
      matchId: string;
      branchId: string;
      wicketsLost: number;
      spanBalls: number;
    }

  | {
      type: "PARTNERSHIP_BUILD";
      matchId: string;
      branchId: string;
      runsAdded: number;
      ballsFaced: number;
    }

  | {
      type: "MOMENTUM_SHIFT";
      matchId: string;
      branchId: string;
      direction: "BATTING" | "BOWLING";
      intensity: number;
    }

  | {
      type: "TURNING_POINT";
      matchId: string;
      branchId: string;
      winProbChange: number;
    }

  | {
      type: "HIGH_PRESSURE";
      matchId: string;
      branchId: string;
      requiredRR: number;
    }

  | {
      type: "DOMINANCE";
      matchId: string;
      branchId: string;
      team: "BATTING" | "BOWLING";
    }

  | {
      type: "DEATH_OVERS";
      matchId: string;
      branchId: string;
      over: number;
    };