/*
================================================
DIRECTOR SIGNAL TYPES
All signals that the Director Engine can react to
================================================
*/

export type DirectorSignal =
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
      subtype: "SIX" | "WICKET";
    }

  /*
  -----------------------------------------------
  TACTICAL SIGNALS (NEW)
  -----------------------------------------------
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
    };