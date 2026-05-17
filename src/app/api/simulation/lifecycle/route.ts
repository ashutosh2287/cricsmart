import { NextRequest, NextResponse } from "next/server";
import { transitionSimulationLifecycle } from "@/services/simulation/simulation-orchestrator";
import { SIMULATION_LIFECYCLE_STATES } from "@/services/simulation/simulation-lifecycle";
import type { SimulationLifecycleState } from "@/services/simulation/simulation-lifecycle";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    matchId?: string;
    lifecycle?: string;
  };

  const matchId = body.matchId?.trim();
  if (!matchId) {
    return NextResponse.json({ success: false, error: "matchId required" }, { status: 400 });
  }

  if (
    !body.lifecycle ||
    !SIMULATION_LIFECYCLE_STATES.includes(body.lifecycle as SimulationLifecycleState)
  ) {
    return NextResponse.json(
      { success: false, error: "valid lifecycle required" },
      { status: 400 }
    );
  }

  const updated = await transitionSimulationLifecycle(
    matchId,
    body.lifecycle as SimulationLifecycleState
  );
  return NextResponse.json({ success: true, updated });
}
