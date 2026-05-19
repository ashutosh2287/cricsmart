import test from "node:test";
import assert from "node:assert/strict";
import { isRateLimitedForRoute, readClientIp } from "./authRateLimitCore";

test("readClientIp prefers first x-forwarded-for address", () => {
  const req = new Request("http://localhost", {
    headers: {
      "x-forwarded-for": "203.0.113.10, 198.51.100.20",
      "x-real-ip": "192.0.2.1",
    },
  });
  assert.equal(readClientIp(req), "203.0.113.10");
});

test("isRateLimitedForRoute blocks login after 10 attempts per IP", async () => {
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
    assert.equal(blocked, false);
  }

  const blocked = await isRateLimitedForRoute("login", req, {
    login: loginLimiter,
    signup: loginLimiter,
  });
  assert.equal(blocked, true);
});

