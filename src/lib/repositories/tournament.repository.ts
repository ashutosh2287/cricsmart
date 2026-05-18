import type { Tournament } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreateTournamentInput = {
  name: string;
  organizerId: string;
  format?: string;
  location?: string;
  bannerUrl?: string;
  startDate: Date;
  endDate: Date;
  visibility?: string;
};

export async function createTournament(input: CreateTournamentInput): Promise<Tournament> {
  return prisma.tournament.create({
    data: {
      name: input.name.trim(),
      organizerId: input.organizerId,
      format: input.format?.trim() || null,
      location: input.location?.trim() || null,
      bannerUrl: input.bannerUrl?.trim() || null,
      startDate: input.startDate,
      endDate: input.endDate,
      visibility: input.visibility ?? "PUBLIC",
    },
  });
}

export async function listTournamentsPublic() {
  return prisma.tournament.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      teams: {
        include: {
          team: true,
        },
      },
      matches: {
        include: {
          hostedMatch: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listTournamentsByOrganizer(organizerId: string) {
  return prisma.tournament.findMany({
    where: { organizerId },
    include: {
      teams: {
        include: {
          team: true,
        },
      },
      matches: {
        include: {
          hostedMatch: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTournamentById(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: {
        include: {
          team: true,
        },
      },
      matches: {
        include: {
          hostedMatch: {
            include: {
              teamA: true,
              teamB: true,
            },
          },
        },
      },
      memberships: true,
    },
  });
}

export async function addTeamToTournament(tournamentId: string, teamId: string) {
  return prisma.tournamentTeam.upsert({
    where: {
      tournamentId_teamId: {
        tournamentId,
        teamId,
      },
    },
    update: {},
    create: {
      tournamentId,
      teamId,
    },
  });
}

export async function addHostedMatchToTournament(tournamentId: string, hostedMatchId: string) {
  return prisma.tournamentMatch.upsert({
    where: {
      tournamentId_hostedMatchId: {
        tournamentId,
        hostedMatchId,
      },
    },
    update: {},
    create: {
      tournamentId,
      hostedMatchId,
    },
  });
}
