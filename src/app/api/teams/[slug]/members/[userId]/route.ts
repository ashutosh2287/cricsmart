import { NextRequest, NextResponse } from "next/server";
import {
  isTeamOwner,
  leaveTeam,
  removeTeamMemberByOwner,
} from "@/lib/repositories/team.repository";
import { handleTeamError, requireTeam } from "@/lib/repositories/teamGuards";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

type RouteContext = { params: Promise<{ slug: string; userId: string }> };

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await getRequiredRequestAuthSession("/api/teams");

  try {
    const { slug, userId } = await context.params;
    const team = await requireTeam(slug);

    const isSelf = session.userId === userId;
    const owner = await isTeamOwner(team.id, session.userId);

    if (isSelf && owner) {
      return NextResponse.json(
        {
          success: false,
          error: "Team owner cannot leave. Delete the team or transfer ownership first.",
        },
        { status: 400 },
      );
    }

    if (!owner && !isSelf) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 },
      );
    }

    if (isSelf) {
      const left = await leaveTeam(team.id, session.userId);
      if (!left) {
        return NextResponse.json(
          { success: false, error: "Failed to leave team" },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true });
    }

    const removed = await removeTeamMemberByOwner(team.id, session.userId, userId);
    if (!removed) {
      return NextResponse.json(
        { success: false, error: "Failed to remove member" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleTeamError(error);
  }
}
