// ═══════════════════════════════════════════════════════════════════
// FILE 4
// Path:     src/app/home/page.tsx
// Action:   CREATE (new file — this is where your existing dashboard goes)
// Purpose:  The authenticated dashboard that was previously at /.
//           Moves your existing HomePageClient here so logged-in users
//           land at /home after the redirect in (landing)/page.tsx.
//           This is your existing page.tsx logic, unchanged — just moved.
// ═══════════════════════════════════════════════════════════════════

import HomePageClient from "@/components/home/HomePageClient";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

export default async function HomePage() {
  const [
    liveMatchCount,
    teamCount,
    totalMatchCount,
    liveMatchesRaw,
    session,
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
        take: 5,
      })
      .catch(() => []),
    getRequestAuthSession(),
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
      liveMatchCount={liveMatchCount}
      teamCount={teamCount}
      totalMatchCount={totalMatchCount}
      liveHostedMatches={liveMatches}
      isLoggedIn={Boolean(session)}
    />
  );
}