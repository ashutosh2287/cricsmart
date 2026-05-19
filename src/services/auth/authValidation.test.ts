import test from "node:test";
import assert from "node:assert/strict";
import { parseLoginPayload, parseSignupPayload } from "./authValidation";

test("parseLoginPayload rejects malformed and extra fields", () => {
  const malformed = parseLoginPayload({ email: "bad-email", password: "12345678" });
  assert.equal(malformed.success, false);

  const extraField = parseLoginPayload({
    email: "user@example.com",
    password: "12345678",
    role: "admin",
  });
  assert.equal(extraField.success, false);
});

test("parseLoginPayload sanitizes email identifier", () => {
  const result = parseLoginPayload({
    email: "  USER@Example.com ",
    password: "12345678",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.identifier, "user@example.com");
  }
});

test("parseSignupPayload rejects malformed and extra fields", () => {
  const malformed = parseSignupPayload({
    username: "abc",
    email: "bad-email",
    password: "12345678",
    confirmPassword: "12345678",
  });
  assert.equal(malformed.success, false);

  const extraField = parseSignupPayload({
    username: "abc",
    email: "user@example.com",
    password: "12345678",
    confirmPassword: "12345678",
    role: "admin",
  });
  assert.equal(extraField.success, false);
});

