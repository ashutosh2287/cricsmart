import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { handleTeamError, requireTeam, requireTeamOwner } from "@/lib/repositories/teamGuards";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

type RouteContext = { params: Promise<{ slug: string; memberId: string }> };

const updateSquadMemberSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    jerseyNo: z.number().int().min(1).max(99).nullable().optional(),
    role: z.enum(["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"]).optional(),
    playerProfileId: z.string().min(1).nullable().optional(),
    userId: z.string().min(1).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await getRequiredRequestAuthSession("/api/teams");

  try {
    const { slug, memberId } = await context.params;
    const team = await requireTeam(slug);
    await requireTeamOwner(team.id, session.userId);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
    }

    const parsed = updateSquadMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const existing = await prisma.teamSquadMember.findFirst({
      where: {
        id: memberId,
        teamId: team.id,
      },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Squad member not found" }, { status: 404 });
    }

    const player = await prisma.teamSquadMember.update({
      where: { id: memberId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.jerseyNo !== undefined ? { jerseyNo: parsed.data.jerseyNo } : {}),
        ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
        ...(parsed.data.playerProfileId !== undefined
          ? { playerProfileId: parsed.data.playerProfileId ?? null }
          : {}),
        ...(parsed.data.userId !== undefined ? { userId: parsed.data.userId ?? null } : {}),
      },
    });

    return NextResponse.json({ success: true, player });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Jersey number already exists in this squad" },
        { status: 409 },
      );
    }
    return handleTeamError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await getRequiredRequestAuthSession("/api/teams");

  try {
    const { slug, memberId } = await context.params;
    const team = await requireTeam(slug);
    await requireTeamOwner(team.id, session.userId);

    const deleted = await prisma.teamSquadMember.deleteMany({
      where: { id: memberId, teamId: team.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ success: false, error: "Squad member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleTeamError(error);
  }
}
