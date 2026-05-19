import type { Team, TeamMember, TeamMemberRole, TeamVisibility } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreateTeamInput = {
  ownerId: string;
  name: string;
  slug?: string;
  description?: string | null;
  visibility?: TeamVisibility;
  shortName?: string;
  city?: string;
  logoUrl?: string | null;
};

export type UpdateTeamInput = {
  name?: string;
  description?: string | null;
  visibility?: TeamVisibility;
  shortName?: string;
  slug?: string;
  city?: string | null;
  logoUrl?: string | null;
};

export type AddTeamMemberInput = {
  teamId: string;
  userId: string;
  role?: TeamMemberRole;
};

function normalizeOptional(value?: string | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function deriveShortName(name: string): string {
  const normalized = name.trim().toUpperCase();
  if (!normalized) return "TEAM";
  if (normalized.length >= 3) return normalized.slice(0, 3);
  return normalized.padEnd(3, "X");
}

function toSlug(value: string): string {
  const input = value.trim().toLowerCase();
  let slug = "";
  let wasDash = false;

  for (const char of input) {
    const isAlphaNum = (char >= "a" && char <= "z") || (char >= "0" && char <= "9");
    if (isAlphaNum) {
      slug += char;
      wasDash = false;
      continue;
    }

    if (!wasDash && slug.length > 0) {
      slug += "-";
      wasDash = true;
    }
  }

  return slug.endsWith("-") ? slug.slice(0, -1) : slug;
}

async function ensureUniqueTeamSlug(base: string, options?: { excludeTeamId?: string }): Promise<string> {
  const root = base || "team";
  let slug = root;
  let suffix = 1;

  while (true) {
    const existing = await prisma.team.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === options?.excludeTeamId) {
      return slug;
    }

    slug = `${root}-${suffix}`;
    suffix += 1;
  }
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const name = input.name.trim();
  const slugBase = toSlug(input.slug ?? name);
  const slug = await ensureUniqueTeamSlug(slugBase);

  return prisma.team.create({
    data: {
      ownerId: input.ownerId,
      name,
      slug,
      description: normalizeOptional(input.description),
      visibility: input.visibility ?? "PUBLIC",
      shortName: normalizeOptional(input.shortName) ?? deriveShortName(name),
      city: normalizeOptional(input.city),
      logoUrl: normalizeOptional(input.logoUrl),
    },
  });
}

export async function getTeamBySlug(slug: string): Promise<Team | null> {
  return prisma.team.findUnique({
    where: { slug: slug.trim() },
  });
}

export async function addTeamMember(input: AddTeamMemberInput): Promise<TeamMember> {
  return prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: input.teamId,
        userId: input.userId,
      },
    },
    update: input.role ? { role: input.role } : {},
    create: {
      teamId: input.teamId,
      userId: input.userId,
      role: input.role ?? "MEMBER",
    },
  });
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  return prisma.team.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { createdAt: "desc" },
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

  const nextSlug = input.slug
    ? await ensureUniqueTeamSlug(toSlug(input.slug), { excludeTeamId: id })
    : undefined;
  const nextShortName =
    input.shortName !== undefined
      ? normalizeOptional(input.shortName) ?? deriveShortName(input.name?.trim() ?? existing.name)
      : undefined;

  return prisma.team.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined ? { description: normalizeOptional(input.description) } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
      ...(nextShortName !== undefined ? { shortName: nextShortName } : {}),
      ...(input.city !== undefined ? { city: normalizeOptional(input.city) } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: normalizeOptional(input.logoUrl) } : {}),
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
