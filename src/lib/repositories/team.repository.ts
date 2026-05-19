import { Prisma, type Team } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreateTeamInput = {
  ownerId: string;
  name: string;
  shortName: string;
  city?: string;
  logoUrl?: string | null;
};

export type UpdateTeamInput = {
  name?: string;
  shortName?: string;
  city?: string | null;
  logoUrl?: string | null;
};

export type TeamWithOwner = Prisma.TeamGetPayload<{
  include: {
    owner: true;
  };
}>;

export type TeamWithEngagementCounts = Prisma.TeamGetPayload<{
  include: {
    _count: {
      select: {
        followers: true;
        favorites: true;
      };
    };
  };
}>;

function toNullableTrimmedString(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  return value?.trim() || null;
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  return prisma.team.create({
    data: {
      ownerId: input.ownerId,
      name: input.name.trim(),
      shortName: input.shortName.trim(),
      city: toNullableTrimmedString(input.city),
      logoUrl: toNullableTrimmedString(input.logoUrl),
    },
  });
}

export async function listTeams(): Promise<Team[]> {
  return prisma.team.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function listTeamsByOwner(ownerId: string): Promise<Team[]> {
  return prisma.team.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findTeamById(id: string): Promise<Team | null> {
  return prisma.team.findUnique({ where: { id } });
}

export async function getTeamById(id: string): Promise<TeamWithEngagementCounts | null> {
  return prisma.team.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          followers: true,
          favorites: true,
        },
      },
    },
  });
}

export async function getTeamWithOwnerById(id: string): Promise<TeamWithOwner | null> {
  return prisma.team.findUnique({
    where: { id },
    include: {
      owner: true,
    },
  });
}

export async function updateTeamByOwner(id: string, ownerId: string, input: UpdateTeamInput): Promise<Team | null> {
  const existing = await prisma.team.findFirst({
    where: { id, ownerId },
    select: { id: true },
  });
  if (!existing) {
    return null;
  }

  return prisma.team.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.shortName !== undefined ? { shortName: input.shortName.trim() } : {}),
      ...(input.city !== undefined ? { city: toNullableTrimmedString(input.city) } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: toNullableTrimmedString(input.logoUrl) } : {}),
    },
  });
}

export async function deleteTeamByOwner(id: string, ownerId: string): Promise<boolean> {
  const deleted = await prisma.team.deleteMany({
    where: { id, ownerId },
  });
  return deleted.count > 0;
}
