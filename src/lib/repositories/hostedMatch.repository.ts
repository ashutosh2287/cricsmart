import type { HostedMatch } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type UpsertHostedLiveMatchInput = {
  externalMatchId: string;
  teamA: string;
  teamB: string;
};

type CreateHostedMatchInput = {
  slug: string;
  title: string;
  format: string;
  venue?: string;
  startTime: Date;
  createdById: string;
  teamAId: string;
  teamBId: string;
  visibility?: string;
  scoringMode?: string;
  status?: string;
};

type UpdateHostedMatchInput = {
  title?: string;
  format?: string;
  venue?: string | null;
  startTime?: Date;
  status?: string;
  visibility?: string;
  scoringMode?: string;
};

type UpsertHostedMatchMemberInput = {
  hostedMatchId: string;
  userId: string;
  role: string;
};

const hostedMatchWithTeams = {
  include: {
    teamA: true,
    teamB: true,
  },
} as const;

export async function findHostedMatchById(id: string): Promise<HostedMatch | null> {
  return prisma.hostedMatch.findUnique({ where: { id } });
}

export async function getHostedMatchById(id: string) {
  return prisma.hostedMatch.findUnique({
    where: { id },
    ...hostedMatchWithTeams,
  });
}

export async function getHostedMatchBySlug(slug: string) {
  return prisma.hostedMatch.findUnique({
    where: { slug },
    ...hostedMatchWithTeams,
  });
}

export async function createHostedMatch(input: CreateHostedMatchInput) {
  return prisma.hostedMatch.create({
    data: {
      slug: input.slug,
      title: input.title,
      format: input.format,
      venue: input.venue?.trim() || null,
      startTime: input.startTime,
      createdById: input.createdById,
      teamAId: input.teamAId,
      teamBId: input.teamBId,
      visibility: input.visibility ?? "PUBLIC",
      scoringMode: input.scoringMode ?? "LIVE",
      status: input.status ?? "DRAFT",
    },
    ...hostedMatchWithTeams,
  });
}

export async function listHostedMatchesPublic() {
  return prisma.hostedMatch.findMany({
    where: { visibility: "PUBLIC" },
    ...hostedMatchWithTeams,
    orderBy: { createdAt: "desc" },
  });
}

export async function listHostedMatchesByCreator(createdById: string) {
  return prisma.hostedMatch.findMany({
    where: { createdById },
    ...hostedMatchWithTeams,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateHostedMatchByOwner(
  id: string,
  userId: string,
  input: UpdateHostedMatchInput
) {
  const existing = await prisma.hostedMatch.findUnique({ where: { id } });
  if (!existing || existing.createdById !== userId) {
    return null;
  }

  return prisma.hostedMatch.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.format !== undefined ? { format: input.format } : {}),
      ...(input.venue !== undefined ? { venue: input.venue } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.scoringMode !== undefined ? { scoringMode: input.scoringMode } : {}),
    },
    ...hostedMatchWithTeams,
  });
}

export async function deleteHostedMatchByOwner(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.hostedMatch.findUnique({ where: { id } });
  if (!existing || existing.createdById !== userId) {
    return false;
  }

  await prisma.hostedMatch.delete({ where: { id } });
  return true;
}

export async function hasHostedMatchControlAccess(
  hostedMatchId: string,
  userId: string,
  role: string
): Promise<boolean> {
  if (role === "admin") return true;

  const match = await prisma.hostedMatch.findUnique({
    where: { id: hostedMatchId },
    select: { createdById: true },
  });

  if (!match) return false;
  if (match.createdById === userId) return true;

  const membership = await prisma.hostedMatchMember.findUnique({
    where: {
      hostedMatchId_userId: {
        hostedMatchId,
        userId,
      },
    },
  });

  return membership !== null;
}

export async function upsertHostedMatchMember(input: UpsertHostedMatchMemberInput) {
  return prisma.hostedMatchMember.upsert({
    where: {
      hostedMatchId_userId: {
        hostedMatchId: input.hostedMatchId,
        userId: input.userId,
      },
    },
    update: { role: input.role },
    create: {
      hostedMatchId: input.hostedMatchId,
      userId: input.userId,
      role: input.role,
    },
  });
}

export async function removeHostedMatchMember(hostedMatchId: string, userId: string) {
  await prisma.hostedMatchMember.deleteMany({
    where: { hostedMatchId, userId },
  });
}

export async function upsertHostedLiveMatch(input: UpsertHostedLiveMatchInput): Promise<HostedMatch> {
  const slug = `live-${input.externalMatchId}`;
  return prisma.hostedMatch.upsert({
    where: { externalMatchId: input.externalMatchId },
    update: {
      teamAName: input.teamA.trim(),
      teamBName: input.teamB.trim(),
      type: "LIVE",
    },
    create: {
      externalMatchId: input.externalMatchId,
      slug,
      teamAName: input.teamA.trim(),
      teamBName: input.teamB.trim(),
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