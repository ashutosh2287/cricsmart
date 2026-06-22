import { redirect } from "next/navigation";
import { findById } from "@/lib/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { ProfileClient } from "./ProfileClient";
import { ProfileStatsCards } from "./ProfileStatsCards";
import { ProfileTeamsSection } from "./ProfileTeamsSection";
import { ProfileActivityFeed } from "./ProfileActivityFeed";
import { ProfileQuickActions } from "./ProfileQuickActions";
import { ProfileFavorites } from "./ProfileFavorites";

export const metadata = { title: "My Profile — CricSmart" };

export default async function ProfilePage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/profile");

  const user = await findById(session.userId);
  if (!user) redirect("/login");

  const userId = session.userId;

  const [
    ownedTeams,
    memberTeams,
    matchesHosted,
    matchesCompleted,
    tournamentsOrganized,
    tournamentMemberships,
    followedTeams,
    favoriteTeams,
    savedMatches,
    recentMatches,
  ] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, shortName: true, slug: true, logoUrl: true, city: true, visibility: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.teamMember.findMany({
      where: { userId, role: "MEMBER" },
      include: { team: { select: { id: true, name: true, shortName: true, slug: true, logoUrl: true } } },
      take: 5,
      orderBy: { joinedAt: "desc" },
    }),
    prisma.hostedMatch.count({ where: { createdById: userId } }),
    prisma.hostedMatch.count({ where: { createdById: userId, status: "COMPLETED" } }),
    prisma.tournament.count({ where: { organizerId: userId } }),
    prisma.tournamentMember.findMany({
      where: { userId },
      include: { tournament: { select: { id: true, name: true, startDate: true, endDate: true } } },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    prisma.teamFollow.findMany({
      where: { userId },
      include: { team: { select: { id: true, name: true, shortName: true, slug: true, logoUrl: true } } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.favoriteTeam.findMany({
      where: { userId },
      include: { team: { select: { id: true, name: true, shortName: true, slug: true, logoUrl: true } } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedMatch.count({ where: { userId } }),
    prisma.hostedMatch.findMany({
      where: { OR: [{ createdById: userId }, { members: { some: { userId: userId } } }] },
      include: {
        teamA: { select: { name: true, shortName: true } },
        teamB: { select: { name: true, shortName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10">
        {/* ── Hero Profile Header ── */}
        <section className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-brand)]/5 via-transparent to-[var(--accent-brand)]/10 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-[var(--accent-brand)]/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--accent-brand)] to-[var(--accent-brand)]/60 flex items-center justify-center text-3xl font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)]" title="Online" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{user.username}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-brand)]/10 text-[var(--accent-brand)] border border-[var(--accent-brand)]/20">
                  {user.role === "admin" ? "Admin" : user.role === "creator" ? "Creator" : "Member"}
                </span>
              </div>
              <p className="mt-1 text-[var(--text-secondary)]">{user.email}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-[var(--accent-brand)]">{ownedTeams.length + memberTeams.length}</p>
                <p className="text-xs text-[var(--text-muted)]">Teams</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--accent-brand)]">{matchesHosted}</p>
                <p className="text-xs text-[var(--text-muted)]">Matches</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--accent-brand)]">{followedTeams.length}</p>
                <p className="text-xs text-[var(--text-muted)]">Following</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Cards ── */}
        <ProfileStatsCards
          matchesHosted={matchesHosted}
          teamsOwned={ownedTeams.length}
          tournamentsOrganized={tournamentsOrganized}
          savedMatches={savedMatches}
          teamMemberships={memberTeams.length}
          tournamentMemberships={tournamentMemberships.length}
        />

        {/* ── Quick Actions ── */}
        <ProfileQuickActions />

        {/* ── Two Column Layout ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Teams */}
          <ProfileTeamsSection
            ownedTeams={ownedTeams.map(t => ({ ...t, role: "OWNER" as const }))}
            memberTeams={memberTeams.map(m => ({ ...m.team, role: m.role as "MEMBER" }))}
          />

          {/* Favorites & Following */}
          <ProfileFavorites
            followedTeams={followedTeams.map(f => f.team)}
            favoriteTeams={favoriteTeams.map(f => f.team)}
          />
        </div>

        {/* ── Recent Activity ── */}
        <ProfileActivityFeed
          recentMatches={recentMatches.map(m => ({
            id: m.id,
            title: m.title,
            teamA: m.teamA.name,
            teamB: m.teamB.name,
            status: m.status,
            createdAt: m.createdAt.toISOString(),
          }))}
          tournamentMemberships={tournamentMemberships.map(tm => ({
            id: tm.tournament.id,
            name: tm.tournament.name,
            startDate: tm.tournament.startDate.toISOString(),
            endDate: tm.tournament.endDate.toISOString(),
          }))}
        />

        {/* ── Profile Settings ── */}
        <ProfileClient
          user={{
            id: user.id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
          }}
        />
      </div>
    </main>
  );
}
