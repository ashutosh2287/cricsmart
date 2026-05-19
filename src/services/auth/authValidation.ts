import { z } from "zod";

const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const PASSWORD_MIN_LENGTH = 8;

const loginSchema = z
  .object({
    identifier: z.string().trim().min(1).optional(),
    username: z.string().trim().min(3).regex(USERNAME_PATTERN).optional(),
    email: z.string().trim().email().optional(),
    password: z.string().min(PASSWORD_MIN_LENGTH),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.identifier && !value.username && !value.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identifier"],
        message: "identifier, username, or email is required",
      });
    }
  });

const signupSchema = z
  .object({
    username: z.string().trim().min(3).regex(USERNAME_PATTERN),
    email: z.string().trim().email(),
    password: z.string().min(PASSWORD_MIN_LENGTH),
    confirmPassword: z.string().min(PASSWORD_MIN_LENGTH),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type SignupPayload = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function sanitizeLoginIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function parseLoginPayload(input: unknown): { success: true; data: LoginPayload } | { success: false; error: string } {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid login payload" };
  }

  const identifier = parsed.data.identifier ?? parsed.data.username ?? parsed.data.email ?? "";
  const sanitizedIdentifier = sanitizeLoginIdentifier(identifier);
  if (!sanitizedIdentifier) {
    return { success: false, error: "Invalid login payload" };
  }

  if (sanitizedIdentifier.includes("@")) {
    const emailCheck = z.string().email().safeParse(sanitizedIdentifier);
    if (!emailCheck.success) {
      return { success: false, error: "Invalid email" };
    }
  }

  return {
    success: true,
    data: {
      identifier: sanitizedIdentifier,
      password: parsed.data.password,
    },
  };
}

export function parseSignupPayload(input: unknown): { success: true; data: SignupPayload } | { success: false; error: string } {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid signup payload" };
  }

  return {
    success: true,
    data: {
      username: parsed.data.username.toLowerCase(),
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      confirmPassword: parsed.data.confirmPassword,
    },
  };
}
