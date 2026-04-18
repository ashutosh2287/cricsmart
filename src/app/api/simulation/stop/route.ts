import { NextRequest, NextResponse } from "next/server";
import { stopSimulation } from "@/services/simulation/matchSimulator";

export async function POST(req: NextRequest) {
  const { matchId } = await req.json();

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  stopSimulation(matchId);

  return NextResponse.json({ success: true });
}