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
      subtype: "SIX" | "FOUR" | "WICKET";
    }

  /*
  -----------------------------------------------
  REPLAY CONTROL SIGNAL (NEW)
  -----------------------------------------------
  */

  | {
      type: "REPLAY_REQUEST";
      matchId: string;
      branchId: string;
      eventId: string;
      replayType: "WICKET" | "BOUNDARY" | "TURNING_POINT";
    }

  /*
  -----------------------------------------------
  TACTICAL SIGNALS
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