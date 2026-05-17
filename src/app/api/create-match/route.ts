import { createDraftSimulationSession } from "@/services/simulation/simulation-orchestrator";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const teamA = body?.teamA?.trim();
    const teamB = body?.teamB?.trim();

    if (!teamA || !teamB) {
      return Response.json(
        { success: false, error: "teamA and teamB are required" },
        { status: 400 }
      );
    }

    const { matchId } = await createDraftSimulationSession({ teamA, teamB });

    return Response.json({
      success: true,
      matchId,
      slug: matchId,
    });
  } catch (err) {
    console.error("❌ CREATE MATCH ERROR:", err);

    return Response.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create match",
      },
      { status: 500 }
    );
  }
}
