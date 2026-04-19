import "server-only";
import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      tls: {}, // ✅ REQUIRED for Upstash
      maxRetriesPerRequest: 1,
    });

    redis.on("connect", () => {
      console.log("🟢 Redis Connected");
    });

    redis.on("error", (err) => {
      console.error("🔴 Redis Error:", err);
    });
  }

  return redis;
}