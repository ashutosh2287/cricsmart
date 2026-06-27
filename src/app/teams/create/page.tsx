import { redirect } from "next/navigation";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { CreateTeamForm } from "./CreateTeamForm";

export const metadata = { title: "Create Team — CricLens" };

export default async function CreateTeamPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/teams/create");

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Team Setup</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Create Team</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Set up your squad and invite members later.</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <CreateTeamForm userId={session.userId} />
        </div>
      </div>
    </main>
  );
}
