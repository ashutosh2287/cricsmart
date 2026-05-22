import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getTeamBySlug, isTeamOwner } from "@/lib/repositories/team.repository";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  jerseyNo: z.coerce.number().int().min(0).max(999).nullable().optional(),
  role: z.string().trim().min(1).max(30).optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string; memberId: string }> }
) {
  const session = await getRequiredRequestAuthSession("/teams");
  const { slug, memberId } = await context.params;

  const team = await getTeamBySlug(slug);
  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  const owner = await isTeamOwner(team.id, session.userId);
  if (!owner) {
    return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await prisma.teamMember.findFirst({
    where: {
      id: memberId,
      teamId: team.id,
      userId: null,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 });
  }

  const updated = await prisma.teamMember.update({
    where: { id: memberId },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.jerseyNo !== undefined ? { jerseyNo: parsed.data.jerseyNo } : {}),
      ...(parsed.data.role !== undefined ? { playerRole: parsed.data.role } : {}),
    },
    select: {
      id: true,
      name: true,
      jerseyNo: true,
      playerRole: true,
    },
  });

  return NextResponse.json({
    success: true,
    member: {
      id: updated.id,
      name: updated.name ?? "Unknown Player",
      jerseyNo: updated.jerseyNo,
      role: updated.playerRole ?? "PLAYER",
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ slug: string; memberId: string }> }
) {
  const session = await getRequiredRequestAuthSession("/teams");
  const { slug, memberId } = await context.params;

  const team = await getTeamBySlug(slug);
  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  const owner = await isTeamOwner(team.id, session.userId);
  if (!owner) {
    return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
  }

  const deleted = await prisma.teamMember.deleteMany({
    where: {
      id: memberId,
      teamId: team.id,
      userId: null,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ success: false, error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}