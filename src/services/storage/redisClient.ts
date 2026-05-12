import "server-only";
import Redis from "ioredis";

let redis: Redis | null = null;

function normalizeRedisUrl(rawUrl: string): string {
  let value = rawUrl.trim();

  // Common typo: "...:6379s" (trailing "s" on port)
  value = value.replace(/:(\d+)s(?=\/|$)/, ":$1");

  try {
    const parsed = new URL(value);
    const isUpstashHost = /^([a-z0-9-]+\.)*upstash\.io$/i.test(parsed.hostname);

    if (parsed.protocol === "redis:" && isUpstashHost) {
      parsed.protocol = "rediss:";
    }

    return parsed.toString();
  } catch {
    throw new Error(
      "Invalid REDIS_URL. Use a valid URL like redis://<host>:6379 or rediss://<host>:6379"
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
