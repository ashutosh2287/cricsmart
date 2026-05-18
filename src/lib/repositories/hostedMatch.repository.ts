import { prisma } from "@/lib/db/prisma";

type UpsertHostedLiveMatchInput = {
  externalMatchId: string;
  teamA: string;
  teamB: string;
};

export type HostedMatch = {
  id: string;
  externalMatchId: string | null;
  teamA: string;
  teamB: string;
  type: string;
  runtimeMatchId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type HostedMatchDelegate = {
  findUnique(args: { where: { id: string } }): Promise<HostedMatch | null>;
  upsert(args: {
    where: { externalMatchId: string };
    update: { teamA: string; teamB: string; type: string };
    create: { externalMatchId: string; teamA: string; teamB: string; type: string };
  }): Promise<HostedMatch>;
  update(args: { where: { id: string }; data: { runtimeMatchId: string } }): Promise<HostedMatch>;
};

function getHostedMatchDelegate(): HostedMatchDelegate {
  const candidate = prisma as unknown as { hostedMatch?: HostedMatchDelegate };
  if (!candidate.hostedMatch) {
    throw new Error('Prisma client is missing "hostedMatch". Run "npx prisma generate".');
  }
  return candidate.hostedMatch;
}

export async function findHostedMatchById(id: string): Promise<HostedMatch | null> {
  return getHostedMatchDelegate().findUnique({ where: { id } });
}

export async function upsertHostedLiveMatch(input: UpsertHostedLiveMatchInput): Promise<HostedMatch> {
  return getHostedMatchDelegate().upsert({
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
  return getHostedMatchDelegate().update({
    where: { id: hostedMatchId },
    data: { runtimeMatchId },
  });
}
