export type DirectorSignal =
  /*
  =========================================
  EXISTING SIGNALS (KEEP)
  =========================================
  */
  | {
      type: "MOMENTUM_UPDATE";
      matchId: string;
      branchId: string;
      eventId: string;
      value: number;
    }
  | {
      type: "PRESSURE_SPIKE";
      matchId: string;
      branchId: string;
      eventId: string;
    }
  | {
      type: "HIGHLIGHT_DETECTED";
      matchId: string;
      branchId: string;
      eventId: string;
      subtype: "WICKET" | "BOUNDARY";
    }
  | {
      type: "REPLAY_REQUEST";
      matchId: string;
      branchId: string;
      eventId: string;
    }

  /*
  =========================================
  EXISTING OUTPUT SIGNALS
  =========================================
  */
  | {
      type: "COLLAPSE_ALERT";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    }
  | {
      type: "ASSAULT_PHASE";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    }
  | {
      type: "STRANGLE_ALERT";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    }
  | {
      type: "PANIC_MODE";
      matchId: string;
      branchId: string;
      eventId: string;
    }
  | {
      type: "RECOVERY_PHASE";
      matchId: string;
      branchId: string;
      eventId: string;
    }

  /*
  =========================================
  🔥 NEW SIGNALS (THIS FIXES YOUR ERRORS)
  =========================================
  */

  | {
      type: "TURNING_POINT";
      matchId: string;
      branchId: string;
      eventId: string;
      winProbChange: number;
    }

  | {
      type: "TURNING_POINT_ALERT";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    }

  | {
      type: "MOMENTUM_SHIFT";
      matchId: string;
      branchId: string;
      eventId: string;
      direction: "BATTING" | "BOWLING";
      intensity: number;
    }

  | {
      type: "MOMENTUM_STORY";
      matchId: string;
      branchId: string;
      eventId: string;
      direction: "BATTING" | "BOWLING";
      intensity: number;
    }

  | {
      type: "DOMINANCE";
      matchId: string;
      branchId: string;
      eventId: string;
      team: "BATTING" | "BOWLING";
    }

  | {
      type: "DOMINANCE_PHASE";
      matchId: string;
      branchId: string;
      eventId: string;
      team: "BATTING" | "BOWLING";
      intensity: number;
    };