import { NextRequest, NextResponse } from "next/server";
import { pauseSimulation } from "@/services/simulation/matchSimulator";
import { transitionSimulationLifecycle } from "@/services/simulation/simulation-orchestrator";

export async function POST(req: NextRequest) {
  const { matchId } = await req.json();

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  pauseSimulation(matchId);
  await transitionSimulationLifecycle(matchId, "PAUSED");

  return NextResponse.json({ success: true });
}
