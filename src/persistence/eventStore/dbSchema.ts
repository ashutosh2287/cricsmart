import Dexie, { Table } from "dexie";
import { BallEvent } from "@/types/ballEvent";
import { MatchState } from "@/services/matchEngine";

/*
-------------------------------------------------------
DATABASE TYPES
-------------------------------------------------------
*/

export interface StoredEvent extends BallEvent {
  matchId: string;
}

export interface StoredSnapshot {
  id?: number;
  matchId: string;
  over: number;
  state: MatchState;
}

/*
-------------------------------------------------------
DEXIE DATABASE
-------------------------------------------------------
*/

class CricSmartDB extends Dexie {

  events!: Table<StoredEvent, number>;
  snapshots!: Table<StoredSnapshot, number>;

  constructor() {
    super("cricsmart-db");

    this.version(1).stores({

      // append-only canonical event log
      events: "++id, matchId, over, branchId, timestamp",

      // deterministic rebuild anchors
      snapshots: "++id, matchId, over"

    });
  }
}

export const db = new CricSmartDB();