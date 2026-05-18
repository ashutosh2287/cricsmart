import { NextRequest, NextResponse } from "next/server";
import { getTournamentById } from "@/lib/repositories/tournament.repository";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const tournament = await getTournamentById(id);

  if (!tournament) {
    return NextResponse.json({ success: false, error: "Tournament not found" }, { status: 404 });
  }

  if (tournament.visibility !== "PUBLIC") {
    return NextResponse.json({ success: false, error: "Tournament not available" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: tournament });
}
