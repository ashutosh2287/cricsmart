import { NextRequest, NextResponse } from "next/server";
import { createTeam, getUserTeams } from "@/lib/repositories/team.repository";
import { handleTeamError } from "@/lib/repositories/teamGuards";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";
import { createTeamSchema } from "@/services/teams/teamValidation";

export async function POST(req: NextRequest) {
  const session = await getRequiredRequestAuthSession("/api/teams");

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 },
      );
    }

    const parsed = createTeamSchema.safeParse(body);
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

    const team = await createTeam({
      ...parsed.data,
      ownerId: session.userId,
    });

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error) {
    return handleTeamError(error);
  }
}

export async function GET() {
  const session = await getRequiredRequestAuthSession("/api/teams");

  try {
    const teams = await getUserTeams(session.userId);
    return NextResponse.json({ success: true, teams });
  } catch (error) {
    return handleTeamError(error);
  }
}
