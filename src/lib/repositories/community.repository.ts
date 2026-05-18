import { prisma } from "@/lib/db/prisma";

export async function followTeam(userId: string, teamId: string) {
  return prisma.teamFollow.upsert({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    update: {},
    create: {
      userId,
      teamId,
    },
  });
}

export async function unfollowTeam(userId: string, teamId: string) {
  await prisma.teamFollow.deleteMany({
    where: {
      userId,
      teamId,
    },
  });
}

export async function favoriteTeam(userId: string, teamId: string) {
  return prisma.favoriteTeam.upsert({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
    update: {},
    create: {
      userId,
      teamId,
    },
  });
}

export async function unfavoriteTeam(userId: string, teamId: string) {
  await prisma.favoriteTeam.deleteMany({
    where: {
      userId,
      teamId,
    },
  });
}

export async function saveHostedMatch(userId: string, hostedMatchId: string) {
  return prisma.savedMatch.upsert({
    where: {
      userId_hostedMatchId: {
        userId,
        hostedMatchId,
      },
    },
    update: {},
    create: {
      userId,
      hostedMatchId,
    },
  });
}

export async function unsaveHostedMatch(userId: string, hostedMatchId: string) {
  await prisma.savedMatch.deleteMany({
    where: {
      userId,
      hostedMatchId,
    },
  });
}

export async function listFavoriteTeams(userId: string) {
  return prisma.favoriteTeam.findMany({
    where: { userId },
    include: {
      team: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSavedMatches(userId: string) {
  return prisma.savedMatch.findMany({
    where: { userId },
    include: {
      hostedMatch: {
        include: {
          teamA: true,
          teamB: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
