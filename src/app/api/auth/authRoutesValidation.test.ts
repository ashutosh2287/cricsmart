import test from "node:test";
import assert from "node:assert/strict";
import { POST as loginPost } from "./login/route";
import { POST as signupPost } from "./signup/route";

function jsonRequest(url: string, payload: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

test("login route rejects malformed payloads with 400", async () => {
  process.env.AUTH_ENABLED = "true";

  const badEmail = await loginPost(
    jsonRequest("http://localhost/api/auth/login", {
      email: "bad-email",
      password: "12345678",
    }) as never
  );
  assert.equal(badEmail.status, 400);

  const extraFields = await loginPost(
    jsonRequest("http://localhost/api/auth/login", {
      email: "user@example.com",
      password: "12345678",
      role: "admin",
    }) as never
  );
  assert.equal(extraFields.status, 400);
});

test("signup route rejects malformed payloads with 400", async () => {
  process.env.AUTH_ENABLED = "true";

  const badEmail = await signupPost(
    jsonRequest("http://localhost/api/auth/signup", {
      username: "tester",
      email: "bad-email",
      password: "12345678",
      confirmPassword: "12345678",
    }) as never
  );
  assert.equal(badEmail.status, 400);

  const extraFields = await signupPost(
    jsonRequest("http://localhost/api/auth/signup", {
      username: "tester",
      email: "user@example.com",
      password: "12345678",
      confirmPassword: "12345678",
      role: "admin",
    }) as never
  );
  assert.equal(extraFields.status, 400);
});

