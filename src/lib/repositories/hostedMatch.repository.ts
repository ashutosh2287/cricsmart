import type { HostedMatch, HostedMatchMember } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreateHostedMatchInput = {
  slug: string;
  title: string;
  format: string;
  venue?: string;
  startTime: Date;
  createdById: string;
  teamAId: string;
  teamBId: string;
  status?: string;
  visibility?: string;
  scoringMode?: string;
};

export type UpdateHostedMatchInput = {
  title?: string;
  format?: string;
  venue?: string | null;
  startTime?: Date;
  status?: string;
  visibility?: string;
  scoringMode?: string;
};

export async function createHostedMatch(input: CreateHostedMatchInput): Promise<HostedMatch> {
  return prisma.hostedMatch.create({
    data: {
      slug: input.slug,
      title: input.title.trim(),
      format: input.format.trim(),
      venue: input.venue?.trim() || null,
      startTime: input.startTime,
      createdById: input.createdById,
      teamAId: input.teamAId,
      teamBId: input.teamBId,
      status: input.status ?? "DRAFT",
      visibility: input.visibility ?? "PUBLIC",
      scoringMode: input.scoringMode ?? "LIVE",
    },
  });
}

export async function listHostedMatchesPublic() {
  return prisma.hostedMatch.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      teamA: true,
      teamB: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listHostedMatchesByCreator(createdById: string) {
  return prisma.hostedMatch.findMany({
    where: { createdById },
    include: {
      teamA: true,
      teamB: true,
      members: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHostedMatchById(id: string) {
  return prisma.hostedMatch.findUnique({
    where: { id },
    include: {
      teamA: true,
      teamB: true,
      members: true,
    },
  });
}

export async function getHostedMatchBySlug(slug: string) {
  return prisma.hostedMatch.findUnique({
    where: { slug },
    include: {
      teamA: true,
      teamB: true,
      members: true,
    },
  });
}

export async function updateHostedMatchByOwner(
  id: string,
  ownerId: string,
  input: UpdateHostedMatchInput,
): Promise<HostedMatch | null> {
  const existing = await prisma.hostedMatch.findUnique({ where: { id } });
  if (!existing || existing.createdById !== ownerId) {
    return null;
  }

  return prisma.hostedMatch.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.format !== undefined ? { format: input.format.trim() } : {}),
      ...(input.venue !== undefined ? { venue: input.venue?.trim() || null } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.scoringMode !== undefined ? { scoringMode: input.scoringMode } : {}),
    },
  });
}

export async function deleteHostedMatchByOwner(id: string, ownerId: string): Promise<boolean> {
  const existing = await prisma.hostedMatch.findUnique({ where: { id } });
  if (!existing || existing.createdById !== ownerId) {
    return false;
  }

  await prisma.hostedMatch.delete({ where: { id } });
  return true;
}

export async function upsertHostedMatchMember(input: {
  hostedMatchId: string;
  userId: string;
  role: string;
}): Promise<HostedMatchMember> {
  return prisma.hostedMatchMember.upsert({
    where: {
      hostedMatchId_userId: {
        hostedMatchId: input.hostedMatchId,
        userId: input.userId,
      },
    },
    update: {
      role: input.role,
    },
    create: {
      hostedMatchId: input.hostedMatchId,
      userId: input.userId,
      role: input.role,
    },
  });
}

export async function removeHostedMatchMember(hostedMatchId: string, userId: string): Promise<void> {
  await prisma.hostedMatchMember.deleteMany({
    where: {
      hostedMatchId,
      userId,
    },
  });
}

export async function hasHostedMatchControlAccess(hostedMatchId: string, userId: string, userRole?: string): Promise<boolean> {
  const hostedMatch = await prisma.hostedMatch.findUnique({
    where: { id: hostedMatchId },
    include: {
      members: true,
    },
  });

  if (!hostedMatch) return false;
  if (hostedMatch.createdById === userId) return true;
  if (userRole === "admin" || userRole === "operator" || userRole === "internal") return true;

  return hostedMatch.members.some((member) => {
    if (member.userId !== userId) return false;
    return ["SCORER", "OPERATOR"].includes(member.role.toUpperCase());
  });
}
