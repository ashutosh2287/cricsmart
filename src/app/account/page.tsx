import Link from "next/link";
import { redirect } from "next/navigation";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

export const metadata = { title: "My Account — CricSmart" };

export default async function AccountPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account");

  const accountCards = [
    {
      label: "My Profile",
      description: "View and update profile details",
      href: "/account/profile",
      icon: "👤",
    },
    {
      label: "Settings",
      description: "Manage account preferences",
      href: "/account/settings",
      icon: "⚙️",
    },
    {
      label: "My Teams",
      description: "Create and manage owned teams",
      href: "/account/teams",
      icon: "🏏",
    },
    {
      label: "Hosted Matches",
      description: "Create hosted matches and scoring controls",
      href: "/account/matches",
      icon: "📋",
    },
    {
      label: "My Tournaments",
      description: "Create tournaments and manage fixtures",
      href: "/account/tournaments",
      icon: "🏆",
    },
    {
      label: "Saved & Favorites",
      description: "Saved matches and favorite teams",
      href: "/account/saved",
      icon: "⭐",
    },
    {
      label: "Activity Feed",
      description: "Recent platform actions and updates",
      href: "/account/activity",
      icon: "📊",
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">
            Account
          </p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">My Account</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Manage your profile, settings, teams, and activity from one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accountCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition hover:border-[var(--accent-brand)]/60"
            >
              <div className="mb-3 text-2xl" aria-hidden="true">
                {card.icon}
              </div>
              <h2 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-brand)]">
                {card.label}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
