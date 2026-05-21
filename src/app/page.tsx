import HomePageClient from "@/components/home/HomePageClient";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

export default async function HomePage() {
  const [liveMatchCount, teamCount, totalMatchCount, session] = await Promise.all([
    prisma.hostedMatch.count({ where: { status: "LIVE" } }),
    prisma.team.count(),
    prisma.hostedMatch.count(),
    getRequestAuthSession(),
  ]);

  return (
    <HomePageClient
      liveMatchCount={liveMatchCount}
      teamCount={teamCount}
      totalMatchCount={totalMatchCount}
      isLoggedIn={Boolean(session)}
    />
  );
}
