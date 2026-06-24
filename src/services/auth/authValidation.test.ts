import { describe, it, expect } from "vitest";
import { parseLoginPayload, parseSignupPayload } from "./authValidation";

describe("parseLoginPayload", () => {
  it("rejects malformed and extra fields", () => {
    const malformed = parseLoginPayload({ email: "bad-email", password: "12345678" });
    expect(malformed.success).toBe(false);

    const extraField = parseLoginPayload({
      email: "user@example.com",
      password: "12345678",
      role: "admin",
    });
    expect(extraField.success).toBe(false);
  });

  it("sanitizes email identifier", () => {
    const result = parseLoginPayload({
      email: "  USER@Example.com ",
      password: "12345678",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.identifier).toBe("user@example.com");
    }
  });
});

describe("parseSignupPayload", () => {
  it("rejects malformed and extra fields", () => {
    const malformed = parseSignupPayload({
      username: "abc",
      email: "bad-email",
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(malformed.success).toBe(false);

    const extraField = parseSignupPayload({
      username: "abc",
      email: "user@example.com",
      password: "12345678",
      confirmPassword: "12345678",
      role: "admin",
    });
    expect(extraField.success).toBe(false);
  });
});
