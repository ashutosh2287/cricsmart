import { NextResponse } from "next/server";
import { getMatchBySlug } from "@/services/matchService";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const match = await getMatchBySlug(id);

  if (!match) {
    return NextResponse.json(
      { success: false, message: "Match not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    match
  });
}
