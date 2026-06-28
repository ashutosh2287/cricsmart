"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { stagger, fadeUp, springBounce } from "@/components/ui/motion";
import { Card } from "@/components/ui/Card";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import {
  User,
  Settings,
  Users,
  ClipboardList,
  Trophy,
  Star,
  BarChart3,
  Plus,
  Radio,
  CheckCircle,
  UserPlus,
  Bookmark,
} from "lucide-react";

interface User {
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

interface Stats {
  ownedTeams: number;
  matchesHosted: number;
  matchesLive: number;
  matchesCompleted: number;
  tournamentsOrganized: number;
  followedTeams: number;
  savedMatches: number;
}

interface Props {
  user: User;
  stats: Stats;
}

const navCards = [
  {
    label: "My Profile",
    description: "View and update your profile details, avatar, and username",
    href: "/account/profile",
    icon: User,
    gradient: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/40",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    label: "Settings",
    description: "Manage password, preferences, and account security",
    href: "/account/settings",
    icon: Settings,
    gradient: "from-gray-500/20 to-gray-600/5",
    border: "border-gray-500/20",
    hoverBorder: "hover:border-gray-500/40",
    iconBg: "bg-gray-500/10",
    iconColor: "text-gray-400",
  },
  {
    label: "My Teams",
    description: "Create teams, manage squads, and invite members",
    href: "/account/teams",
    icon: Users,
    gradient: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    label: "Hosted Matches",
    description: "Create, manage, and score your hosted matches",
    href: "/account/matches",
    icon: ClipboardList,
    gradient: "from-blue-500/20 to-cyan-500/5",
    border: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/40",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    label: "Tournaments",
    description: "Organize tournaments, manage fixtures and standings",
    href: "/account/tournaments",
    icon: Trophy,
    gradient: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    label: "Saved & Favourites",
    description: "Access saved matches and your favourite teams",
    href: "/account/saved",
    icon: Star,
    gradient: "from-rose-500/20 to-rose-600/5",
    border: "border-rose-500/20",
    hoverBorder: "hover:border-rose-500/40",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
  },
  {
    label: "Activity Feed",
    description: "Timeline of your recent actions and updates",
    href: "/account/activity",
    icon: BarChart3,
    gradient: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/20",
    hoverBorder: "hover:border-purple-500/40",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
  },
];

const quickActions = [
  { label: "Create Team", href: "/teams/create", icon: Plus, color: "text-emerald-400" },
  { label: "Host Match", href: "/host/matches/create", icon: ClipboardList, color: "text-blue-400" },
  { label: "New Tournament", href: "/tournaments/create", icon: Trophy, color: "text-amber-400" },
];

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
  creator: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  public: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function AccountPageClient({ user, stats }: Props) {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-8">
        {/* Hero Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-brand)]/5 via-transparent to-[var(--accent-brand)]/10 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--accent-brand)]/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-brand)] to-[var(--accent-brand)]/60 flex items-center justify-center text-2xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{user.username}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[user.role] || roleColors.public}`}>
                  {user.role === "admin" ? "Admin" : user.role === "creator" ? "Creator" : "Member"}
                </span>
              </div>
              <p className="mt-1 text-[var(--text-secondary)]">{user.email}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>

            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-[var(--accent-brand)]">{stats.matchesHosted}</p>
                <p className="text-xs text-[var(--text-muted)]">Matches</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--accent-brand)]">{stats.ownedTeams}</p>
                <p className="text-xs text-[var(--text-muted)]">Teams</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--accent-brand)]">{stats.tournamentsOrganized}</p>
                <p className="text-xs text-[var(--text-muted)]">Tournaments</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stats Overview */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid gap-3 grid-cols-2 sm:grid-cols-4"
        >
          {[
            { label: "Live Matches", value: stats.matchesLive, icon: Radio, color: "text-red-400" },
            { label: "Completed", value: stats.matchesCompleted, icon: CheckCircle, color: "text-emerald-400" },
            { label: "Following", value: stats.followedTeams, icon: UserPlus, color: "text-blue-400" },
            { label: "Saved", value: stats.savedMatches, icon: Bookmark, color: "text-amber-400" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={fadeUp}>
              <Card className="p-4 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <AnimatedCounter value={stat.value} label={stat.label} duration={1500} />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-3"
          >
            {quickActions.map((action) => (
              <motion.div key={action.label} variants={springBounce}>
                <Link href={action.href}>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-overlay)] hover:border-[var(--accent-brand)]/30 transition-all cursor-pointer group">
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-brand)] transition-colors">
                      {action.label}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Navigation Grid */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Manage Your Account</h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {navCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.href} variants={fadeUp}>
                  <Link href={card.href}>
                    <Card hover className={`group p-5 border ${card.border} ${card.hoverBorder} transition-colors`}>
                      <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${card.iconColor}`} />
                      </div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-brand)] transition-colors">
                        {card.label}
                      </h3>
                      <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                        {card.description}
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--accent-brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Open</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
