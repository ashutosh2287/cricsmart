import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getRequiredRequestAuthSession } from "@/services/auth/serverRequestContext";

const schema = z.object({
  tossWinnerId: z.string().min(1),
  tossDecision: z.enum(["BAT", "BOWL"]),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getRequiredRequestAuthSession("/hosted-matches");
    const { matchId } = await context.params;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    const match = await prisma.hostedMatch.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        createdById: true,
        teamAId: true,
        teamBId: true,
      },
    });

    if (!match) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    if (match.createdById !== session.userId) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    if (![match.teamAId, match.teamBId].includes(parsed.data.tossWinnerId)) {
      return NextResponse.json({ success: false, error: "Toss winner must be one of the match teams" }, { status: 400 });
    }

    const battingFirstId =
      parsed.data.tossDecision === "BAT"
        ? parsed.data.tossWinnerId
        : parsed.data.tossWinnerId === match.teamAId
          ? match.teamBId
          : match.teamAId;

    const updated = await prisma.hostedMatch.update({
      where: { id: matchId },
      data: {
        tossWinnerId: parsed.data.tossWinnerId,
        tossDecision: parsed.data.tossDecision,
        battingFirstId,
      },
    });

    return NextResponse.json({ success: true, match: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save toss" }, { status: 500 });
  }
}
