import { Ratelimit } from "@upstash/ratelimit";
import type { Redis as IORedis } from "ioredis";
import { getRedis } from "@/services/storage/redisClient";
import { isRateLimitedForRoute, type AuthRateLimitRoute, type AuthRouteLimiter } from "./authRateLimitCore";

const LOGIN_LIMIT_ATTEMPTS = 10;
const LOGIN_LIMIT_WINDOW = "15 m";

type UpstashCompatibleRedis = {
  evalsha: <TData = unknown>(sha: string, keys: string[], args: unknown[]) => Promise<TData>;
  eval: <TData = unknown>(script: string, keys: string[], args: unknown[]) => Promise<TData>;
  get: <TData = string>(key: string) => Promise<TData | null>;
  set: <TData = unknown>(key: string, value: unknown) => Promise<"OK" | TData | null>;
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
    async evalsha<TData = unknown>(sha: string, keys: string[], args: unknown[]) {
      const result = await redis.evalsha(sha, keys.length, ...keys, ...args.map((v) => String(v)));
      return normalizeRedisResult(result) as TData;
    },
    async eval<TData = unknown>(script: string, keys: string[], args: unknown[]) {
      const result = await redis.eval(script, keys.length, ...keys, ...args.map((v) => String(v)));
      return normalizeRedisResult(result) as TData;
    },
    async get<TData = string>(key: string) {
      return (await redis.get(key)) as TData | null;
    },
    async set<TData = unknown>(key: string, value: unknown) {
      return (await redis.set(key, String(value))) as "OK" | TData | null;
    },
  };
}

let rateLimiters: Record<AuthRateLimitRoute, AuthRouteLimiter> | null = null;

function getRateLimiters(): Record<AuthRateLimitRoute, AuthRouteLimiter> {
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

export async function isAuthRouteRateLimited(
  route: AuthRateLimitRoute,
  req: Request
): Promise<boolean> {
  return await isRateLimitedForRoute(route, req, getRateLimiters());
}