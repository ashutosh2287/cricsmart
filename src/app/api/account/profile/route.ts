import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";
import {
  PROFILE_USERNAME_MAX_LENGTH,
  PROFILE_USERNAME_MESSAGE,
  PROFILE_USERNAME_MIN_LENGTH,
  PROFILE_USERNAME_REGEX,
} from "@/lib/validation/profile";

const schema = z
  .object({
    username: z
      .string()
      .trim()
      .min(PROFILE_USERNAME_MIN_LENGTH)
      .max(PROFILE_USERNAME_MAX_LENGTH)
      .regex(PROFILE_USERNAME_REGEX, PROFILE_USERNAME_MESSAGE)
      .optional(),
    avatarUrl: z.string().url().nullable().optional(),
  })
  .strict();

export async function PATCH(req: NextRequest) {
  const session = await getRequiredRequestAuthSession("/account/profile");

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const normalizedUsername = parsed.data.username?.toLowerCase();

    if (normalizedUsername) {
      const existing = await prisma.user.findUnique({
        where: { username: normalizedUsername },
      });

      if (existing && existing.id !== session.userId) {
        return NextResponse.json({ success: false, error: "Username already taken" }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(normalizedUsername && { username: normalizedUsername }),
        ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
