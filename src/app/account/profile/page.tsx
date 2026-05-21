import { redirect } from "next/navigation";
import { findById } from "@/lib/repositories/user.repository";
import { prisma } from "@/lib/db/prisma";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { ProfileClient } from "./ProfileClient";

export const metadata = { title: "My Profile — CricSmart" };

export default async function ProfilePage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/profile");

  const user = await findById(session.userId);
  if (!user) redirect("/login");

  const [ownedTeams, matchesHosted] = await Promise.all([
    prisma.team.count({ where: { ownerId: session.userId } }),
    prisma.hostedMatch.count({ where: { createdById: session.userId } }),
  ]);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Account</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">My Profile</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage your username and avatar details.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-xs text-[var(--text-secondary)]">Teams Owned</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{ownedTeams}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
            <p className="text-xs text-[var(--text-secondary)]">Matches Hosted</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{matchesHosted}</p>
          </div>
        </div>

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
