import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

const schema = z
  .object({
    username: z.string().trim().min(2).max(30).regex(/^[a-z0-9_]+$/).optional(),
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

    if (parsed.data.username) {
      const existing = await prisma.user.findUnique({
        where: { username: parsed.data.username },
      });

      if (existing && existing.id !== session.userId) {
        return NextResponse.json({ success: false, error: "Username already taken" }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(parsed.data.username && { username: parsed.data.username }),
        ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
      },
    });

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
