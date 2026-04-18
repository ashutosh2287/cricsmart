import { NextRequest, NextResponse } from "next/server";
import { setSimulationSpeed } from "@/services/simulation/matchSimulator";

export async function POST(req: NextRequest) {
  const { matchId, speed } = await req.json();

  if (!matchId || typeof speed !== "number") {
    return NextResponse.json(
      { error: "matchId + speed required" },
      { status: 400 }
    );
  }

  setSimulationSpeed(speed, matchId);

  return NextResponse.json({ success: true, speed });
}