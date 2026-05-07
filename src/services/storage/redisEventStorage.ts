import { EventStorage, StoredEvent } from "./eventStorage";
import { BallEvent } from "@/types/ballEvent";
import { getRedis } from "./redisClient";

import "server-only";

export class RedisEventStorage implements EventStorage {

  async appendEvent(
    matchId: string,
    event: BallEvent
  ): Promise<void> {

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

  async getMatchEvents(
    matchId: string
  ): Promise<StoredEvent[]> {

    const redis = getRedis();

    const data = await redis.lrange(
      `match:${matchId}:events`,
      0,
      -1
    );

    return data.map((e: string) =>
      JSON.parse(e)
    );
  }

  async clearMatchEvents(
    matchId: string
  ): Promise<void> {

    const redis = getRedis();

    await redis.del(
      `match:${matchId}:events`
    );
  }
}