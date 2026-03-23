/*
================================================
DIRECTOR SIGNAL TYPES
All signals that the Director Engine can react to
================================================
*/

export type DirectorSignal =
  /*
  ===============================================
  BASE INPUT SIGNALS
  ===============================================
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
      subtype: "SIX" | "FOUR" | "WICKET";
    }

  /*
  ===============================================
  REPLAY CONTROL
  ===============================================
  */
  | {
      type: "REPLAY_REQUEST";
      matchId: string;
      branchId: string;
      eventId: string;
      replayType: "WICKET" | "BOUNDARY" | "TURNING_POINT";
    }

  /*
  ===============================================
  EXISTING TACTICAL OUTPUTS
  ===============================================
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
      intensity: number;
    }
  | {
      type: "RECOVERY_PHASE";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    }

  /*
  ===============================================
  🔥 NEW AI STORY SIGNALS (CRITICAL FIX)
  ===============================================
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