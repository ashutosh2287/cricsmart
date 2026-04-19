import { RedisSimulationStorage } from "./redisSimulationStorage";
import { MemorySimulationStorage } from "./memoryStorage";
import { MatchState } from "@/services/matchEngine";

/**
 * 🔹 Storage Model
 */
export type StoredSimulation = {
  matchId: string;
  state: MatchState; // ✅ correct
  control: {
    isRunning: boolean;
    isPaused: boolean;
    speed: number;
  };
  updatedAt: number;
};

/**
 * 🔹 Storage Interface (ASYNC)
 */
export interface SimulationStorage {
  load(matchId: string): Promise<StoredSimulation | null>;

  save(
    matchId: string,
    state: MatchState, // ✅ FIXED
    control: {
      isRunning: boolean;
      isPaused: boolean;
      speed: number;
    }
  ): Promise<void>;

  delete(matchId: string): Promise<void>;
}

/**
 * 🔹 ACTIVE STORAGE (SWAPPABLE)
 */
const USE_REDIS = typeof window === "undefined"; // 🔥 toggle

const storage: SimulationStorage = USE_REDIS
  ? new RedisSimulationStorage()
  : new MemorySimulationStorage();

/**
 * 🔹 Public API (ASYNC)
 */
export async function saveSimulation(
  matchId: string,
  state: MatchState, // ✅ FIXED
  control: {
    isRunning: boolean;
    isPaused: boolean;
    speed: number;
  }
) {
  return storage.save(matchId, state, control);
}

export async function loadSimulation(matchId: string) {
  return storage.load(matchId);
}

export async function deleteSimulation(matchId: string) {
  return storage.delete(matchId);
}