import { Ratelimit } from "@upstash/ratelimit";
import type { Redis as IORedis } from "ioredis";
import type { NextRequest } from "next/server";
import { getRedis } from "@/services/storage/redisClient";

const LOGIN_LIMIT_ATTEMPTS = 10;
const LOGIN_LIMIT_WINDOW = "15 m";

type RouteName = "login" | "signup";
type Limiter = Pick<Ratelimit, "limit">;

type UpstashCompatibleRedis = {
  evalsha: (sha: string, keys: string[], args: (string | number)[]) => Promise<unknown>;
  eval: (script: string, keys: string[], args: (string | number)[]) => Promise<unknown>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<unknown>;
};

function normalizeRedisResult(result: unknown): unknown {
  if (Array.isArray(result)) {
    return result.map((item) => normalizeRedisResult(item));
  }
  if (typeof result === "number") {
    return result.toString();
  }
  return result;
}

function createUpstashRedisAdapter(redis: IORedis): UpstashCompatibleRedis {
  return {
    async evalsha(sha, keys, args) {
      const result = await redis.evalsha(sha, keys.length, ...keys, ...args.map((value) => String(value)));
      return normalizeRedisResult(result);
    },
    async eval(script, keys, args) {
      const result = await redis.eval(script, keys.length, ...keys, ...args.map((value) => String(value)));
      return normalizeRedisResult(result);
    },
    async get(key) {
      return await redis.get(key);
    },
    async set(key, value) {
      return await redis.set(key, value);
    },
  };
}

let rateLimiters: Record<RouteName, Limiter> | null = null;

function getRateLimiters(): Record<RouteName, Limiter> {
  if (rateLimiters) return rateLimiters;

  const redisAdapter = createUpstashRedisAdapter(getRedis());
  rateLimiters = {
    login: new Ratelimit({
      redis: redisAdapter,
      limiter: Ratelimit.slidingWindow(LOGIN_LIMIT_ATTEMPTS, LOGIN_LIMIT_WINDOW),
      prefix: "auth:ratelimit:login",
    }),
    signup: new Ratelimit({
      redis: redisAdapter,
      limiter: Ratelimit.slidingWindow(LOGIN_LIMIT_ATTEMPTS, LOGIN_LIMIT_WINDOW),
      prefix: "auth:ratelimit:signup",
    }),
  };
  return rateLimiters;
}

export function readClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export async function isAuthRouteRateLimited(route: RouteName, req: NextRequest | Request): Promise<boolean> {
  const ip = readClientIp(req);
  const result = await getRateLimiters()[route].limit(ip);
  return !result.success;
}

export function setAuthRateLimitersForTest(limiters: Record<RouteName, Limiter> | null): void {
  rateLimiters = limiters;
}
