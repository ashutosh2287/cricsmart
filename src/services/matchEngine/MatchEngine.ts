import { randomUUID } from "crypto";
import { getRedis } from "@/services/storage/redisClient";

type CreateRuntimeInput = {
  hostedMatchId: string;
  title: string;
};

type RuntimeState = {
  runtimeMatchId: string;
  hostedMatchId: string;
  title: string;
  status: "live";
  createdAt: number;
};

function getRuntimeKey(runtimeMatchId: string) {
  return `match:${runtimeMatchId}`;
}

export class MatchEngine {
  static async create(input: CreateRuntimeInput): Promise<string> {
    const runtimeMatchId = randomUUID();
    const redis = getRedis();

    const runtimeState: RuntimeState = {
      runtimeMatchId,
      hostedMatchId: input.hostedMatchId,
      title: input.title,
      status: "live",
      createdAt: Date.now(),
    };

    await redis.set(getRuntimeKey(runtimeMatchId), JSON.stringify(runtimeState));
    return runtimeMatchId;
  }

  static async delete(runtimeMatchId: string): Promise<void> {
    const redis = getRedis();
    await redis.del(getRuntimeKey(runtimeMatchId));
  }
}
