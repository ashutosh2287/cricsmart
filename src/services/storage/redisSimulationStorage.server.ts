import "server-only";

import { SimulationStorage, StoredSimulation } from "./simulationStorage";
import { MatchState } from "@/services/matchEngine";
import { getRedis } from "./redisClient";

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

    const data: StoredSimulation = {
      matchId,
      state,
      control,
      updatedAt: Date.now(),
    };

    await redis.set(
      `match:${matchId}:state`,
      JSON.stringify(data)
    );
  }

  async load(matchId: string): Promise<StoredSimulation | null> {
    const redis = getRedis();

    const data = await redis.get(`match:${matchId}:state`);
    return data ? JSON.parse(data) : null;
  }

  async delete(matchId: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`match:${matchId}:state`);
  }
}