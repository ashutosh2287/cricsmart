import { MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { MatchEngine } from "@/services/matchEngine/MatchEngine";

export class StartMatchError extends Error {
  constructor(
    public readonly statusCode: 403 | 404 | 409,
    message: string,
  ) {
    super(message);
    this.name = "StartMatchError";
  }
}

export async function startMatch(input: { hostedMatchId: string; userId: string }) {
  const hostedMatch = await prisma.hostedMatch.findUnique({
    where: { id: input.hostedMatchId },
    select: {
      id: true,
      title: true,
      createdById: true,
      status: true,
      runtimeMatchId: true,
    },
  });

  if (!hostedMatch) {
    throw new StartMatchError(404, "Hosted match not found");
  }

  if (hostedMatch.createdById !== input.userId) {
    throw new StartMatchError(403, "Forbidden");
  }

  if (hostedMatch.runtimeMatchId || hostedMatch.status === MatchStatus.LIVE || hostedMatch.status === MatchStatus.COMPLETED) {
    throw new StartMatchError(409, "Match already started");
  }

  const runtimeMatchId = await MatchEngine.create({
    hostedMatchId: hostedMatch.id,
    title: hostedMatch.title,
  });

  try {
    const updated = await prisma.hostedMatch.updateMany({
      where: {
        id: hostedMatch.id,
        createdById: input.userId,
        runtimeMatchId: null,
        status: MatchStatus.DRAFT,
      },
      data: {
        runtimeMatchId,
        status: MatchStatus.LIVE,
      },
    });

    if (updated.count !== 1) {
      throw new StartMatchError(409, "Match already started");
    }
  } catch (error) {
    await MatchEngine.delete(runtimeMatchId);
    throw error;
  }

  return {
    runtimeMatchId,
    matchCenterUrl: `/match/${runtimeMatchId}`,
  };
}
