import Dexie, { Table } from "dexie";
import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";

export type StoredEvent = BallEvent & {
  matchId: string;
};

export interface StoredSnapshot {
  id?: number;
  matchId: string;
  innings: number;
  over: number;
  state: MatchState;
  createdAt: number;
}

class CricSmartDB extends Dexie {
  events!: Table<StoredEvent, [string, number]>;
  snapshots!: Table<StoredSnapshot, number>;

  constructor() {
    super("cricsmart-db");

    this.version(1).stores({
      events: "[matchId+timestamp], matchId, timestamp, over, branchId",
      snapshots: "++id, matchId, over",
    });

    this.version(2).stores({
      events: "[matchId+timestamp], matchId, timestamp, over, branchId",
      snapshots: "++id, matchId, innings, over, createdAt, [matchId+innings+over]",
    });
  }
}

let dbInstance: CricSmartDB | null = null;

export function isBrowserPersistenceAvailable() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

export function getDb(): CricSmartDB {
  if (!isBrowserPersistenceAvailable()) {
    throw new Error(
      "CricSmartDB is only available in the browser. Do not import browser persistence into server/runtime engine code."
    );
  }

  if (!dbInstance) {
    dbInstance = new CricSmartDB();
  }

  return dbInstance;
}