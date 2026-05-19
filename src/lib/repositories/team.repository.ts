import { Prisma, TeamMemberRole, TeamVisibility, type Team, type TeamMember } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreateTeamInput = {
  ownerId: string;
  name: string;
  shortName?: string;
  city?: string;
  description?: string;
  visibility?: TeamVisibility;
  logoUrl?: string | null;
};

export type UpdateTeamInput = {
  name?: string;
  shortName?: string;
  city?: string | null;
  description?: string | null;
  visibility?: TeamVisibility;
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

export type TeamWithMembers = Prisma.TeamGetPayload<{
  include: {
    members: true;
  };
}>;

function toNullableTrimmedString(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  return value?.trim() || null;
}

function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toShortName(input: string): string {
  const parts = input
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (parts.length >= 2) return parts;
  const fallback = input.replace(/[^a-zA-Z0-9]+/g, "").slice(0, 3).toUpperCase();
  return fallback || "TEAM";
}

async function resolveUniqueTeamSlug(name: string): Promise<string> {
  const base = toSlug(name) || "team";
  let candidate = base;
  let counter = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.team.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;

    const suffix = `-${counter}`;
    const maxBaseLength = Math.max(1, 80 - suffix.length);
    candidate = `${base.slice(0, maxBaseLength)}${suffix}`;
    counter += 1;
  }
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const slug = await resolveUniqueTeamSlug(input.name);

  return prisma.team.create({
    data: {
      ownerId: input.ownerId,
      name: input.name.trim(),
      slug,
      shortName: input.shortName?.trim() || toShortName(input.name),
      city: toNullableTrimmedString(input.city),
      description: toNullableTrimmedString(input.description),
      visibility: input.visibility ?? TeamVisibility.PUBLIC,
      logoUrl: toNullableTrimmedString(input.logoUrl),
      members: {
        create: {
          userId: input.ownerId,
          role: TeamMemberRole.OWNER,
        },
      },
    },
  });
}

export async function listTeams(): Promise<Team[]> {
  return prisma.team.findMany({
    where: { visibility: TeamVisibility.PUBLIC },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserTeams(userId: string) {
  return prisma.team.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: {
      members: true,
    },
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

export async function getTeamBySlug(slug: string): Promise<TeamWithMembers | null> {
  return prisma.team.findUnique({
    where: { slug },
    include: {
      members: true,
    },
  });
}

export async function findTeamBySlugOrId(value: string): Promise<Team | null> {
  return prisma.team.findFirst({
    where: {
      OR: [{ id: value }, { slug: value }],
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
      ...(input.description !== undefined ? { description: toNullableTrimmedString(input.description) } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: toNullableTrimmedString(input.logoUrl) } : {}),
    },
  });
}

export async function updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team> {
  return prisma.team.update({
    where: { id: teamId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.shortName !== undefined ? { shortName: input.shortName.trim() } : {}),
      ...(input.city !== undefined ? { city: toNullableTrimmedString(input.city) } : {}),
      ...(input.description !== undefined ? { description: toNullableTrimmedString(input.description) } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
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

export async function deleteTeam(teamId: string): Promise<void> {
  await prisma.team.delete({ where: { id: teamId } });
}

export async function isTeamOwner(teamId: string, userId: string): Promise<boolean> {
  const team = await prisma.team.findFirst({
    where: { id: teamId, ownerId: userId },
    select: { id: true },
  });
  return Boolean(team);
}

export async function isTeamMember(teamId: string, userId: string): Promise<boolean> {
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    select: { id: true },
  });
  return Boolean(membership);
}

export async function addTeamMember(teamId: string, userId: string): Promise<TeamMember> {
  return prisma.teamMember.create({
    data: {
      teamId,
      userId,
      role: TeamMemberRole.MEMBER,
    },
  });
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await prisma.teamMember.deleteMany({
    where: {
      teamId,
      userId,
    },
  });
}
