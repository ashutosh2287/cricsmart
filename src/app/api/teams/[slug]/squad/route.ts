import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getTeamBySlug, isTeamOwner } from "@/lib/repositories/team.repository";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  jerseyNo: z.coerce.number().int().min(0).max(999).nullable().optional(),
  role: z.string().trim().min(1, "Role is required").max(30),
});

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const team = await getTeamBySlug(slug);

  if (!team) {
    return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
  }

  const squad = await prisma.teamMember.findMany({
    where: {
      teamId: team.id,
      userId: null,
    },
    select: {
      id: true,
      name: true,
      jerseyNo: true,
      playerRole: true,
      joinedAt: true,
    },
    orderBy: [{ joinedAt: "asc" }],
  });

  return NextResponse.json({
    success: true,
    squad: squad.map((member) => ({
      id: member.id,
      name: member.name ?? "Unknown Player",
      jerseyNo: member.jerseyNo,
      role: member.playerRole ?? "PLAYER",
    })),
  });
}

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const session = await getRequiredRequestAuthSession("/teams");
  const { slug } = await context.params;

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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const created = await prisma.teamMember.create({
    data: {
      teamId: team.id,
      role: "MEMBER",
      userId: null,
      name: parsed.data.name,
      jerseyNo: parsed.data.jerseyNo ?? null,
      playerRole: parsed.data.role,
    },
    select: {
      id: true,
      name: true,
      jerseyNo: true,
      playerRole: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      member: {
        id: created.id,
        name: created.name ?? "Unknown Player",
        jerseyNo: created.jerseyNo,
        role: created.playerRole ?? "PLAYER",
      },
    },
    { status: 201 }
  );
}