import { Prisma, TeamMemberRole, TeamVisibility, type Team } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { generateUniqueSlug } from "@/lib/utils/slug";

export type CreateTeamInput = {
  ownerId: string;
  name: string;
  shortName?: string;
  city?: string;
  logoUrl?: string | null;
  description?: string;
  visibility?: TeamVisibility;
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

export type TeamWithMembers = Prisma.TeamGetPayload<{
  include: {
    owner: {
      select: {
        id: true;
        username: true;
        avatarUrl: true;
      };
    };
    members: {
      include: {
        user: {
          select: {
            id: true;
            username: true;
            avatarUrl: true;
          };
        };
      };
      orderBy: {
        joinedAt: "asc";
      };
    };
    _count: {
      select: {
        members: true;
        followers: true;
        favorites: true;
      };
    };
  };
}>;

export type UserTeam = Prisma.TeamGetPayload<{
  include: {
    _count: {
      select: {
        members: true;
      };
    };
  };
}>;

function toNullableTrimmedString(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  return value?.trim() || null;
}

function buildShortName(name: string): string {
  const normalized = name
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const initials = normalized
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (initials) return initials;
  return name.trim().slice(0, 3).toUpperCase() || "TMC";
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const name = input.name.trim();
  const slug = await generateUniqueSlug(name, async (candidate) => {
    const existing = await prisma.team.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return Boolean(existing);
  });

  return prisma.team.create({
    data: {
      ownerId: input.ownerId,
      name,
      slug,
      shortName: input.shortName?.trim() || buildShortName(name),
      description: toNullableTrimmedString(input.description),
      visibility: input.visibility ?? TeamVisibility.PUBLIC,
      city: toNullableTrimmedString(input.city),
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
    orderBy: { createdAt: "desc" },
  });
}

export async function listTeamsByOwner(ownerId: string): Promise<Team[]> {
  return prisma.team.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserTeams(userId: string): Promise<UserTeam[]> {
  return prisma.team.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
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
  return prisma.team.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
    include: {
      owner: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
      _count: {
        select: {
          members: true,
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

export async function removeTeamMemberByOwner(teamId: string, ownerId: string, userId: string): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      ownerId: true,
    },
  });

  if (!team || team.ownerId !== ownerId || team.ownerId === userId) {
    return false;
  }

  const deleted = await prisma.teamMember.deleteMany({
    where: {
      teamId,
      userId,
      role: {
        not: TeamMemberRole.OWNER,
      },
    },
  });

  return deleted.count > 0;
}