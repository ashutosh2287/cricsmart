import test from "node:test";
import assert from "node:assert/strict";
import { isAuthRouteRateLimited, setAuthRateLimitersForTest } from "./authRateLimit";

test("isAuthRouteRateLimited blocks login after 10 attempts per IP", async () => {
  const attempts = new Map<string, number>();
  const loginLimiter = {
    async limit(identifier: string) {
      const next = (attempts.get(identifier) ?? 0) + 1;
      attempts.set(identifier, next);
      return {
        success: next <= 10,
        limit: 10,
        remaining: Math.max(0, 10 - next),
        reset: Date.now() + 15 * 60 * 1000,
        pending: Promise.resolve(),
      };
    },
  };

  setAuthRateLimitersForTest({
    login: loginLimiter,
    signup: loginLimiter,
  });
  try {
    const req = new Request("http://localhost/api/auth/login", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });

    for (let i = 1; i <= 10; i++) {
      const blocked = await isAuthRouteRateLimited("login", req);
      assert.equal(blocked, false);
    }

    const blocked = await isAuthRouteRateLimited("login", req);
    assert.equal(blocked, true);
  } finally {
    setAuthRateLimitersForTest(null);
  }
});
