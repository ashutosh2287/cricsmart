import HomePageClient from "@/components/home/HomePageClient";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { findById } from "@/lib/repositories/user.repository";

export default async function HomePage() {
  const session = await getRequestAuthSession();
  const user = session ? await findById(session.userId) : null;

  const [
    liveMatchCount,
    teamCount,
    totalMatchCount,
    liveMatchesRaw,
  ] = await Promise.all([
    prisma.hostedMatch.count({ where: { status: "LIVE" } }),
    prisma.team.count(),
    prisma.hostedMatch.count(),
    prisma.hostedMatch
      .findMany({
        where: { status: "LIVE" },
        include: {
          teamA: { select: { name: true } },
          teamB: { select: { name: true } },
        },
        take: 6,
      })
      .catch(() => []),
  ]);

  const liveMatches = liveMatchesRaw
    .filter((match) => Boolean(match.runtimeMatchId))
    .map((match) => ({
      id: match.id,
      runtimeMatchId: match.runtimeMatchId!,
      title: match.title,
      teamA: match.teamA.name,
      teamB: match.teamB.name,
    }));

  return (
    <HomePageClient
      user={user ? { username: user.username, avatarUrl: user.avatarUrl } : null}
      liveMatchCount={liveMatchCount}
      teamCount={teamCount}
      totalMatchCount={totalMatchCount}
      liveHostedMatches={liveMatches}
      isLoggedIn={Boolean(session)}
    />
  );
}
