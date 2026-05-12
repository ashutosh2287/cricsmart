import "server-only";
import Redis from "ioredis";

let redis: Redis | null = null;

function normalizeRedisUrl(rawUrl: string): string {
  let value = rawUrl.trim();

  value = value.replace(/:(\d+)s(?=\/|$)/, ":$1");

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "redis:" && parsed.hostname.endsWith("upstash.io")) {
      parsed.protocol = "rediss:";
    }
    if (!parsed.port) {
      parsed.port = "6379";
    }
    return parsed.toString();
  } catch {
    throw new Error(
      "Invalid REDIS_URL. Use a valid URL like rediss://default:<password>@<host>:6379"
    );
  }
}

export function getRedis() {
  if (!redis) {
    const rawUrl = process.env.REDIS_URL;
    if (!rawUrl?.trim()) {
      throw new Error("Missing REDIS_URL in environment");
    }

    const redisUrl = normalizeRedisUrl(rawUrl);
    const useTls = redisUrl.startsWith("rediss://");

    redis = new Redis(redisUrl, {
      ...(useTls ? { tls: {} } : {}),
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
