import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getTeamBySlug } from "@/lib/repositories/team.repository";
import { handleTeamError, requireTeam, requireTeamOwner } from "@/lib/repositories/teamGuards";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

type RouteContext = { params: Promise<{ slug: string }> };

const addSquadMemberSchema = z.object({
  name: z.string().trim().min(1).max(50),
  jerseyNo: z.number().int().min(1).max(99).optional(),
  role: z.enum(["BATSMAN", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"]).optional(),
  playerProfileId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
});

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const team = await getTeamBySlug(slug);
    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
    }

    const squad = await prisma.teamSquadMember.findMany({
      where: { teamId: team.id },
      orderBy: [{ jerseyNo: "asc" }, { joinedAt: "asc" }],
    });

    return NextResponse.json({ success: true, squad });
  } catch (error) {
    return handleTeamError(error);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await getRequiredRequestAuthSession("/api/teams");

  try {
    const { slug } = await context.params;
    const team = await requireTeam(slug);
    await requireTeamOwner(team.id, session.userId);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
    }

    const parsed = addSquadMemberSchema.safeParse(body);
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

    const player = await prisma.teamSquadMember.create({
      data: {
        teamId: team.id,
        name: parsed.data.name,
        jerseyNo: parsed.data.jerseyNo,
        role: parsed.data.role ?? "BATSMAN",
        playerProfileId: parsed.data.playerProfileId,
        userId: parsed.data.userId,
      },
    });

    return NextResponse.json({ success: true, player }, { status: 201 });
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
