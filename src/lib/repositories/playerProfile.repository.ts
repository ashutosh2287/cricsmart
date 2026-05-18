import type { PlayerProfile } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreatePlayerProfileInput = {
  userId?: string;
  displayName: string;
  battingStyle?: string;
  bowlingStyle?: string;
  role?: string;
  statsSnapshot?: Record<string, unknown>;
};

export async function createPlayerProfile(input: CreatePlayerProfileInput): Promise<PlayerProfile> {
  return prisma.playerProfile.create({
    data: {
      userId: input.userId || null,
      displayName: input.displayName.trim(),
      battingStyle: input.battingStyle?.trim() || null,
      bowlingStyle: input.bowlingStyle?.trim() || null,
      role: input.role?.trim() || null,
      statsSnapshot: input.statsSnapshot,
    },
  });
}

export async function listPlayerProfiles(): Promise<PlayerProfile[]> {
  return prisma.playerProfile.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlayerProfileById(id: string): Promise<PlayerProfile | null> {
  return prisma.playerProfile.findUnique({ where: { id } });
}
