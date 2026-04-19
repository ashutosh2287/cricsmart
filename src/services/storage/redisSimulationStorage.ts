import { SimulationStorage, StoredSimulation } from "../storage/simulationStorage";
import { getRedis } from "../storage/redisClient";
import { MatchState } from "@/services/matchEngine";

// ✅ CENTRAL KEY BUILDER
const getMatchStateKey = (matchId: string) =>
  `match:${matchId}:state`;

export class RedisSimulationStorage implements SimulationStorage {

  async save(
    matchId: string,
    state: MatchState,
    control: {
      isRunning: boolean;
      isPaused: boolean;
      speed: number;
    }
  ): Promise<void> {

    const redis = getRedis();

    const key = getMatchStateKey(matchId);

    console.log("💾 REDIS SAVE KEY:", key);

    const data: StoredSimulation = {
      matchId,
      state,
      control,
      updatedAt: Date.now(),
    };

    await redis.set(key, JSON.stringify(data));
  }

  async load(matchId: string): Promise<StoredSimulation | null> {
    const redis = getRedis();

    const key = getMatchStateKey(matchId);

    console.log("📥 REDIS LOAD KEY:", key);

    const data = await redis.get(key);

    if (!data) {
      console.error("❌ REDIS MISS for:", key);
      return null;
    }

    return JSON.parse(data);
  }

  async delete(matchId: string): Promise<void> {
    const redis = getRedis();

    const key = getMatchStateKey(matchId);

    await redis.del(key);
  }
}