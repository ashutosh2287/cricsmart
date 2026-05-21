import Link from "next/link";
import AccountLogoutButton from "@/components/account/AccountLogoutButton";

const cardClass =
  "block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition hover:border-[var(--accent-brand)]/70 hover:bg-[var(--bg-raised)]";

const accountCards = [
  {
    label: "My Profile",
    description: "View and update profile details",
    href: "/account/profile",
    icon: "👤",
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
  {
    label: "Settings",
    description: "Manage account preferences",
    href: "/account/settings",
    icon: "⚙️",
  },
];

export default async function AccountDashboardPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">My Account</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        {accountCards.map((card) => (
          <Link key={card.href} href={card.href} className={cardClass}>
            <p className="text-sm" aria-hidden>
              {card.icon}
            </p>
            <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{card.label}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{card.description}</p>
          </Link>
        ))}
      </div>

      <div className="pt-2">
        <AccountLogoutButton />
      </div>
    </div>
  );
}
