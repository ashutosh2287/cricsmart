export type NarrativeSignal =
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
    };