import { NextResponse } from "next/server";
import { getAllMatches } from "@/services/matchService";

export async function GET() {
  const matches = await getAllMatches();

  return NextResponse.json({
    success: true,
    matches
  });
}
