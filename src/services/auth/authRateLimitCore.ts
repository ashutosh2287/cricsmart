import type { NextRequest } from "next/server";

export type AuthRateLimitRoute = "login" | "signup";

export type AuthRouteLimiter = {
  limit: (identifier: string) => Promise<{ success: boolean }>;
};

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

export async function isRateLimitedForRoute(
  route: AuthRateLimitRoute,
  req: NextRequest | Request,
  limiters: Record<AuthRateLimitRoute, AuthRouteLimiter>
): Promise<boolean> {
  const ip = readClientIp(req);
  const result = await limiters[route].limit(ip);
  return !result.success;
}

