import { NextRequest, NextResponse } from "next/server";
import {
  deleteTeamByOwner,
  getTeamBySlug,
  updateTeamByOwner,
} from "@/lib/repositories/team.repository";
import {
  handleTeamError,
  requireTeam,
  requireTeamOwner,
} from "@/lib/repositories/teamGuards";
import {
  getRequestAuthSession,
  getRequiredRequestAuthSession,
} from "@/services/auth/serverRequestContext";
import { updateTeamSchema } from "@/services/teams/teamValidation";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const team = await getTeamBySlug(slug);
    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 },
      );
    }

    if (team.visibility === "PRIVATE") {
      const session = await getRequestAuthSession();
      const isMember =
        team.ownerId === session?.userId ||
        team.members.some((member) => member.userId === session?.userId);
      if (!isMember) {
        return NextResponse.json(
          { success: false, error: "Team not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json({ success: true, team });
  } catch (error) {
    return handleTeamError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await getRequiredRequestAuthSession("/api/teams");

  try {
    const { slug } = await context.params;
    const team = await requireTeam(slug);
    await requireTeamOwner(team.id, session.userId);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 },
      );
    }

    const parsed = updateTeamSchema.safeParse(body);
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

    const updated = await updateTeamByOwner(team.id, session.userId, parsed.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 },
      );
    }
    return NextResponse.json({ success: true, team: updated });
  } catch (error) {
    return handleTeamError(error);
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await getRequiredRequestAuthSession("/api/teams");

  try {
    const { slug } = await context.params;
    const team = await requireTeam(slug);
    await requireTeamOwner(team.id, session.userId);

    const deleted = await deleteTeamByOwner(team.id, session.userId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleTeamError(error);
  }
}
