import { NextResponse } from "next/server";
import { getTeamBySlug, isTeamOwner } from "@/lib/repositories/team.repository";

export class TeamNotFoundError extends Error {
  constructor(message = "Team not found") {
    super(message);
    this.name = "TeamNotFoundError";
  }
}

export class TeamPermissionError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "TeamPermissionError";
  }
}

export async function requireTeam(slug: string) {
  const team = await getTeamBySlug(slug);
  if (!team) {
    throw new TeamNotFoundError();
  }
  return team;
}

export async function requireTeamOwner(teamId: string, userId: string) {
  const owner = await isTeamOwner(teamId, userId);
  if (!owner) {
    throw new TeamPermissionError();
  }
}

export function handleTeamError(error: unknown): NextResponse {
  if (error instanceof TeamNotFoundError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 },
    );
  }

  if (error instanceof TeamPermissionError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 403 },
    );
  }

  console.error("[TEAM_API_ERROR]", error);
  return NextResponse.json(
    { success: false, error: "Something went wrong" },
    { status: 500 },
  );
}
