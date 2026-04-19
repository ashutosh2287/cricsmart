import { SimulationStorage, StoredSimulation } from "./simulationStorage";
import { MatchState } from "@/services/matchEngine";

export class MemorySimulationStorage implements SimulationStorage {
  private db = new Map<string, StoredSimulation>();

  async save(
    matchId: string,
    state: MatchState, // ✅ FIXED
    control: {
      isRunning: boolean;
      isPaused: boolean;
      speed: number;
    }
  ): Promise<void> {

    this.db.set(matchId, {
      matchId,
      state: { ...state }, // ✅ FIXED (actual value, cloned)
      control,
      updatedAt: Date.now(),
    });

  }

  async load(matchId: string): Promise<StoredSimulation | null> {
    return this.db.get(matchId) ?? null;
  }

  async delete(matchId: string): Promise<void> {
    this.db.delete(matchId);
  }
}