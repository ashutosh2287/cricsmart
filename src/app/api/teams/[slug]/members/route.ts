import { NextRequest, NextResponse } from "next/server";
import {
  addTeamMember,
  isTeamMember,
} from "@/lib/repositories/team.repository";
import {
  handleTeamError,
  requireTeam,
  requireTeamOwner,
} from "@/lib/repositories/teamGuards";
import { findById } from "@/lib/repositories/user.repository";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";
import { addMemberSchema } from "@/services/teams/teamValidation";

type RouteContext = { params: Promise<{ slug: string }> };

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
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 },
      );
    }

    const parsed = addMemberSchema.safeParse(body);
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

    const targetUser = await findById(parsed.data.userId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const alreadyMember = await isTeamMember(team.id, parsed.data.userId);
    if (alreadyMember) {
      return NextResponse.json(
        { success: false, error: "User is already a member of this team" },
        { status: 409 },
      );
    }

    const member = await addTeamMember(team.id, parsed.data.userId);
    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    return handleTeamError(error);
  }
}
