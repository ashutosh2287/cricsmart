import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { ActivityTimeline } from "./ActivityTimeline";

export const metadata = { title: "Activity Feed — CricSmart" };

type ActivityItem = {
  id: string;
  type: "match_created" | "match_live" | "match_completed" | "team_created" | "team_joined";
  label: string;
  sublabel: string;
  href?: string;
  timestamp: Date;
  icon: string;
  colorClass: string;
  dotColor: string;
};

export default async function ActivityPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/activity");

  const [matches, teams, teamMemberships] = await Promise.all([
    prisma.hostedMatch.findMany({
      where: { createdById: session.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, status: true, createdAt: true },
    }),
    prisma.team.findMany({
      where: { ownerId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, createdAt: true },
    }),
    prisma.teamMember.findMany({
      where: { userId: session.userId, role: "MEMBER" },
      orderBy: { joinedAt: "desc" },
      take: 5,
      include: {
        team: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const matchItems: ActivityItem[] = matches.map((match) => {
    if (match.status === "LIVE") {
      return {
        id: `match-live-${match.id}`,
        type: "match_live",
        label: `Match is live: ${match.title}`,
        sublabel: "Live scoring in progress",
        href: `/hosted-matches/${match.id}/control`,
        timestamp: match.createdAt,
        icon: "🔴",
        colorClass: "text-red-400",
        dotColor: "bg-red-400",
      };
    }

    if (match.status === "COMPLETED") {
      return {
        id: `match-completed-${match.id}`,
        type: "match_completed",
        label: `Match completed: ${match.title}`,
        sublabel: "Result locked in",
        href: `/hosted-matches/${match.id}/control`,
        timestamp: match.createdAt,
        icon: "✅",
        colorClass: "text-emerald-400",
        dotColor: "bg-emerald-400",
      };
    }

    return {
      id: `match-created-${match.id}`,
      type: "match_created",
      label: `Hosted match: ${match.title}`,
      sublabel: "Draft created",
      href: `/hosted-matches/${match.id}/control`,
      timestamp: match.createdAt,
      icon: "📋",
      colorClass: "text-blue-400",
      dotColor: "bg-blue-400",
    };
  });

  const timeline: ActivityItem[] = [
    ...matchItems,
    ...teams.map((team) => ({
      id: `team-${team.id}`,
      type: "team_created" as const,
      label: `Created team: ${team.name}`,
      sublabel: "You are the owner",
      href: `/teams/${team.slug}`,
      timestamp: team.createdAt,
      icon: "🏏",
      colorClass: "text-emerald-400",
      dotColor: "bg-emerald-400",
    })),
    ...teamMemberships.map((membership) => ({
      id: `membership-${membership.teamId}`,
      type: "team_joined" as const,
      label: `Joined team: ${membership.team.name}`,
      sublabel: "Member",
      href: `/teams/${membership.team.slug}`,
      timestamp: membership.joinedAt,
      icon: "👤",
      colorClass: "text-[var(--accent-brand)]",
      dotColor: "bg-[var(--accent-brand)]",
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Account</p>
        <h1 className="mb-8 text-2xl font-semibold text-[var(--text-primary)]">Activity Feed</h1>
        <ActivityTimeline timeline={timeline} />
      </div>
    </main>
  );
}
