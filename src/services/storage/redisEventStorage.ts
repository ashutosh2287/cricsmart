import { EventStorage, StoredEvent } from "./eventStorage";
import { BallEvent } from "@/types/ballEvent";
import { getRedis } from "./redisClient";
import "server-only";

export class RedisEventStorage implements EventStorage {

  async append(matchId: string, event: BallEvent): Promise<void> {
    const redis = getRedis();

    const stored: StoredEvent = {
      ...event,
      timestamp: Date.now(),
    };

    await redis.rpush(
      `match:${matchId}:events`,
      JSON.stringify(stored)
    );
  }

  async getAll(matchId: string): Promise<StoredEvent[]> {
    const redis = getRedis();

    const data = await redis.lrange(
      `match:${matchId}:events`,
      0,
      -1
    );

    return data.map((e: string) => JSON.parse(e)); // ✅ fixed type
  }

  async clear(matchId: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`match:${matchId}:events`);
  }
}