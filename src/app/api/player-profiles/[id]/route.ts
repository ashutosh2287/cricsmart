import { NextRequest, NextResponse } from "next/server";
import { getPlayerProfileById } from "@/lib/repositories/playerProfile.repository";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const profile = await getPlayerProfileById(id);

  if (!profile) {
    return NextResponse.json({ success: false, error: "Player profile not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: profile });
}
