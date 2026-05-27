import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

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
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Account</p>
        <h1 className="mb-8 text-2xl font-semibold text-[var(--text-primary)]">Activity Feed</h1>

        {timeline.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] py-16 text-center">
            <p className="mb-3 text-3xl">📊</p>
            <p className="text-sm text-[var(--text-secondary)]">
              No activity yet — host a match or create a team to get started.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute bottom-0 left-[0.95rem] top-0 w-px bg-[var(--border-subtle)]" />
            <div className="space-y-3 pl-10">
              {timeline.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[1.95rem] top-6 h-3 w-3 rounded-full border-2 border-[var(--bg-base)] bg-[var(--text-muted)]" />
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 transition hover:border-[var(--text-muted)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-lg">{item.icon}</span>
                        <div>
                          <p className={`text-sm font-medium ${item.colorClass}`}>{item.label}</p>
                          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{item.sublabel}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-[var(--text-muted)]">{item.timestamp.toLocaleDateString()}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {item.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="mt-2 block text-xs text-[var(--text-secondary)] transition hover:text-[var(--accent-brand)]"
                      >
                        View →
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
