import { redirect } from "next/navigation";
import { findById } from "@/lib/repositories/user.repository";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Settings — CricSmart" };

export default async function SettingsPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/settings");

  const user = await findById(session.userId);
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Account</p>
        <h1 className="mb-8 text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>
        <SettingsClient
          user={{
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
          }}
        />
      </div>
    </main>
  );
}
