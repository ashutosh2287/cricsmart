import type { HostedMatch } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type UpsertHostedLiveMatchInput = {
  externalMatchId: string;
  teamA: string;
  teamB: string;
};

export async function findHostedMatchById(id: string): Promise<HostedMatch | null> {
  return prisma.hostedMatch.findUnique({ where: { id } });
}

export async function upsertHostedLiveMatch(input: UpsertHostedLiveMatchInput): Promise<HostedMatch> {
  return prisma.hostedMatch.upsert({
    where: { externalMatchId: input.externalMatchId },
    update: {
      teamA: input.teamA.trim(),
      teamB: input.teamB.trim(),
      type: "LIVE",
    },
    create: {
      externalMatchId: input.externalMatchId,
      teamA: input.teamA.trim(),
      teamB: input.teamB.trim(),
      type: "LIVE",
    },
  });
}

export async function linkHostedMatchRuntime(
  hostedMatchId: string,
  runtimeMatchId: string
): Promise<HostedMatch> {
  return prisma.hostedMatch.update({
    where: { id: hostedMatchId },
    data: { runtimeMatchId },
  });
}
