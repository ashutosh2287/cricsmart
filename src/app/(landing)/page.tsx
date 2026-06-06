// ═══════════════════════════════════════════════════════════════════
// FILE 2
// Path:     src/app/(landing)/page.tsx
// Action:   CREATE (new file inside the new (landing) folder)
// Purpose:  Server component for the landing route (/). 
//           Redirects authenticated users to /home.
//           Fetches real counts from Prisma — same schema you already use.
//           Passes exact props LandingPageClient expects.
// ═══════════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { prisma } from "@/lib/db/prisma";
import LandingPageClient from "@/components/landing/LandingPageClient";

export default async function LandingPage() {
  // ── Auth gate ────────────────────────────────────────────────────
  // Logged-in users skip the landing page entirely
  const session = await getRequestAuthSession().catch(() => null);
  if (session) {
    redirect("/home");
  }

  // ── Real data from your existing Prisma schema ───────────────────
  // All three queries match fields already used in your current page.tsx
  const [liveMatchCount, totalMatchCount, teamCount] = await Promise.all([
    prisma.hostedMatch.count({ where: { status: "LIVE" } }).catch(() => 0),
    prisma.hostedMatch.count().catch(() => 0),
    prisma.team.count().catch(() => 0),
  ]);

  // Live match previews for the ticker — same query shape as your current page.tsx
  const liveMatchesRaw = await prisma.hostedMatch
    .findMany({
      where: { status: "LIVE" },
      include: {
        teamA: { select: { name: true } },
        teamB: { select: { name: true } },
      },
      take: 8,
    })
    .catch(() => []);

  // ── Serialize to plain props (no Prisma objects to client) ────────
  const liveMatches = liveMatchesRaw
    .filter((m) => Boolean(m.runtimeMatchId))
    .map((m) => ({
      id: m.id,
      title: m.title,
      teamA: m.teamA.name,
      teamB: m.teamB.name,
      runtimeMatchId: m.runtimeMatchId ?? undefined,
    }));

  return (
    <LandingPageClient
      liveMatchCount={liveMatchCount}
      totalMatchCount={totalMatchCount}
      teamCount={teamCount}
      liveMatches={liveMatches}
    />
  );
}