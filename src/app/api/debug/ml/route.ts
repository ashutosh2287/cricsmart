import { NextRequest, NextResponse } from "next/server";
import { getMlDiagnostics } from "@/services/ml/observability/mlObservabilityStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId") ?? undefined;

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...getMlDiagnostics(matchId),
  });
}
