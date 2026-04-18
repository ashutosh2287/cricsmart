import { NextResponse } from "next/server";
import { getAllMatches } from "@/services/matchService";
import { runtime } from "../start-simulation/route";

export async function GET() {

  const matches = await getAllMatches();

  return NextResponse.json({
  success: true,
  runtime: runtime ?? {
    isRunning: false,
    isPaused: false,
    speed: 1500,
  },
});

}