import "server-only";
import Redis from "ioredis";

let redis: Redis | null = null;
let warned = false;

function normalizeRedisUrl(rawUrl: string): string {
  let value = rawUrl.trim();
  if (!value) return "";
  value = value.replace(/:(\d+)s\b/, ":$1");
  try {
    const parsed = new URL(value);
    const isUpstashHost = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.upstash\.io$/i.test(parsed.hostname);
    if (parsed.protocol === "redis:" && isUpstashHost) parsed.protocol = "rediss:";
    return parsed.toString();
  } catch {
    return "";
  }
}

export function getRedis(): Redis {
  if (redis) return redis;

  const rawUrl = process.env.REDIS_URL;
  if (!rawUrl) throw new Error("Missing REDIS_URL");

  const url = normalizeRedisUrl(rawUrl);
  if (!url) throw new Error("Invalid REDIS_URL");

  const useTls = url.startsWith("rediss://");

  redis = new Redis(url, {
    ...(useTls ? { tls: {} } : {}),
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    enableOfflineQueue: true,
  });

  redis.on("error", () => {
    if (!warned) {
      warned = true;
      console.warn("⚠️  Redis unavailable — running without cache/sessions");
    }
  });

  return redis;
}
