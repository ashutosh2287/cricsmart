import { redirect } from "next/navigation";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { findById } from "@/lib/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";
import AccountPageClient from "./AccountPageClient";

export const metadata = { title: "My Account — CricLens" };

export default async function AccountPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account");

  const user = await findById(session.userId);
  if (!user) redirect("/login");

  const userId = session.userId;

  const [
    ownedTeams,
    matchesHosted,
    matchesLive,
    matchesCompleted,
    tournamentsOrganized,
    followedTeams,
    savedMatches,
  ] = await Promise.all([
    prisma.team.count({ where: { ownerId: userId } }),
    prisma.hostedMatch.count({ where: { createdById: userId } }),
    prisma.hostedMatch.count({ where: { createdById: userId, status: "LIVE" } }),
    prisma.hostedMatch.count({ where: { createdById: userId, status: "COMPLETED" } }),
    prisma.tournament.count({ where: { organizerId: userId } }),
    prisma.teamFollow.count({ where: { userId } }),
    prisma.savedMatch.count({ where: { userId } }),
  ]);

  return (
    <AccountPageClient
      user={{
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      }}
      stats={{
        ownedTeams,
        matchesHosted,
        matchesLive,
        matchesCompleted,
        tournamentsOrganized,
        followedTeams,
        savedMatches,
      }}
    />
  );
}
