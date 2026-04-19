import { NextResponse } from "next/server";

export async function GET() {
  // Temporary dummy data (replace later with Redis scan)
  return NextResponse.json([]);
}