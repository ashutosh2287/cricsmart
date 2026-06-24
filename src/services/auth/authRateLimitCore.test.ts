import { describe, it, expect } from "vitest";
import { isRateLimitedForRoute, readClientIp } from "./authRateLimitCore";

describe("readClientIp", () => {
  it("prefers first x-forwarded-for address", () => {
    const req = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 198.51.100.20",
        "x-real-ip": "192.0.2.1",
      },
    });
    expect(readClientIp(req)).toBe("203.0.113.10");
  });
});

describe("isRateLimitedForRoute", () => {
  it("blocks login after 10 attempts per IP", async () => {
    const attempts = new Map<string, number>();
    const loginLimiter = {
      async limit(identifier: string) {
        const next = (attempts.get(identifier) ?? 0) + 1;
        attempts.set(identifier, next);
        return { success: next <= 10 };
      },
    };

    const req = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    for (let i = 1; i <= 10; i++) {
      const blocked = await isRateLimitedForRoute("login", req, {
        login: loginLimiter,
        signup: loginLimiter,
      });
      expect(blocked).toBe(false);
    }

    const blocked = await isRateLimitedForRoute("login", req, {
      login: loginLimiter,
      signup: loginLimiter,
    });
    expect(blocked).toBe(true);
  });
});
