import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserTeams } from "@/lib/repositories/team.repository";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

export const metadata = { title: "My Teams — CricSmart" };

export default async function AccountTeamsPage() {
  const session = await getRequestAuthSession();
  if (!session) redirect("/login?redirect=/account/teams");

  const teams = await getUserTeams(session.userId);
  const ownedTeams = teams.filter((team) => team.ownerId === session.userId);
  const memberTeams = teams.filter((team) => team.ownerId !== session.userId);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Account</p>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">My Teams</h1>
          </div>
          <Link
            href="/teams/create"
            className="rounded-lg bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
          >
            + New Team
          </Link>
        </div>

        {teams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] py-16 text-center">
            <p className="mb-3 text-3xl">🏏</p>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">You are not part of any team yet.</p>
            <Link href="/teams/create" className="text-sm font-semibold text-[var(--accent-brand)] hover:underline">
              Create your first team →
            </Link>
          </div>
        ) : null}

        {ownedTeams.length > 0 ? (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Teams You Own
            </h2>
            <div className="space-y-3">
              {ownedTeams.map((team) => (
                <TeamCard key={team.id} team={team} isOwner />
              ))}
            </div>
          </section>
        ) : null}

        {memberTeams.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Teams You Have Joined
            </h2>
            <div className="space-y-3">
              {memberTeams.map((team) => (
                <TeamCard key={team.id} team={team} isOwner={false} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

type TeamCardProps = {
  team: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    visibility: string;
    _count: { members: number };
  };
  isOwner: boolean;
};

function TeamCard({ team, isOwner }: TeamCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-4 transition hover:border-[var(--text-muted)]">
      <div className="min-w-0">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{team.name}</span>
          {team.visibility === "PRIVATE" ? (
            <span className="shrink-0 rounded border border-[var(--border-subtle)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]">
              Private
            </span>
          ) : null}
          {isOwner ? (
            <span className="shrink-0 rounded border border-[var(--accent-brand)]/35 px-1.5 py-0.5 text-xs text-[var(--accent-brand)]">
              Owner
            </span>
          ) : null}
        </div>

        {team.description ? <p className="truncate text-xs text-[var(--text-secondary)]">{team.description}</p> : null}
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {team._count.members} member{team._count.members === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isOwner ? (
          <Link
            href={`/teams/${team.slug}/manage`}
            className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Manage
          </Link>
        ) : null}
        <Link
          href={`/teams/${team.slug}`}
          className="rounded-lg border border-[var(--accent-brand)]/35 px-3 py-1.5 text-xs text-[var(--accent-brand)] transition hover:border-[var(--accent-brand)]/65"
        >
          View →
        </Link>
      </div>
    </div>
  );
}
