import type { Team } from "@prisma/client";
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

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  return prisma.team.create({
    data: {
      ownerId: input.ownerId,
      name: input.name.trim(),
      shortName: input.shortName.trim(),
      city: input.city?.trim() || null,
      logoUrl: input.logoUrl?.trim() || null,
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

export async function getTeamById(id: string): Promise<(Team & { _count: { followers: number; favorites: number } }) | null> {
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

export async function updateTeamByOwner(id: string, ownerId: string, input: UpdateTeamInput): Promise<Team | null> {
  const existing = await prisma.team.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) {
    return null;
  }

  return prisma.team.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.shortName !== undefined ? { shortName: input.shortName.trim() } : {}),
      ...(input.city !== undefined ? { city: input.city?.trim() || null } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl?.trim() || null } : {}),
    },
  });
}

export async function deleteTeamByOwner(id: string, ownerId: string): Promise<boolean> {
  const existing = await prisma.team.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== ownerId) {
    return false;
  }

  await prisma.team.delete({ where: { id } });
  return true;
}
