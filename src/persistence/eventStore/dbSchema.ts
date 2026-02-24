import Dexie, { Table } from "dexie";
import { BallEvent } from "@/types/ballEvent";
import { MatchState, BranchRegistry } from "@/services/matchEngine";

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

export interface StoredBranchRegistry {
  matchId: string;
  registry: BranchRegistry;
}

/*
-------------------------------------------------------
DEXIE DATABASE
-------------------------------------------------------
*/

class CricSmartDB extends Dexie {

  events!: Table<StoredEvent, number>;
  snapshots!: Table<StoredSnapshot, number>;
  branches!: Table<StoredBranchRegistry, string>;

  constructor() {
    super("cricsmart-db");

    this.version(1).stores({

      // append-only event log
      events: "++id, matchId, over, branchId, timestamp",

      // performance snapshots
      snapshots: "++id, matchId, over",

      // branch tree registry
      branches: "matchId"

    });
  }
}

export const db = new CricSmartDB();