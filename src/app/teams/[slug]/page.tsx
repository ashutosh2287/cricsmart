import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeamBySlug } from "@/lib/repositories/team.repository";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const team = await getTeamBySlug(slug);
  return { title: team ? `${team.name} — CricSmart` : "Team Not Found" };
}

export default async function TeamPublicPage({ params }: Props) {
  const { slug } = await params;
  const [team, session] = await Promise.all([getTeamBySlug(slug), getRequestAuthSession()]);

  if (!team) notFound();

  const isMember = team.ownerId === session?.userId || team.members.some((member) => member.userId === session?.userId);
  if (team.visibility === "PRIVATE" && !isMember) {
    notFound();
  }

  const isOwner = session?.userId === team.ownerId;
  const userMembers = team.members.filter(
    (member): member is typeof member & { userId: string; user: NonNullable<typeof member.user> } =>
      Boolean(member.userId && member.user)
  );
  const ownerPresent = userMembers.some((member) => member.userId === team.ownerId);
  type RosterMember = {
    userId: string;
    role: string;
    user: { id: string; username: string; avatarUrl: string | null };
  };
  const roster: RosterMember[] = ownerPresent
    ? userMembers.map((member) => ({
        userId: member.userId,
        role: member.role,
        user: member.user,
      }))
    : [
        {
          userId: team.owner.id,
          role: "OWNER",
          user: {
            id: team.owner.id,
            username: team.owner.username,
            avatarUrl: team.owner.avatarUrl,
          },
        },
        ...userMembers.map((member) => ({
          userId: member.userId,
          role: member.role,
          user: member.user,
        })),
      ];

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Team</p>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{team.name}</h1>
            {team.description ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{team.description}</p> : null}
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {roster.length} member{roster.length === 1 ? "" : "s"} ·{" "}
              {team.visibility === "PRIVATE" ? "🔒 Private" : "🌐 Public"}
            </p>
          </div>

          {isOwner ? (
            <Link
              href={`/teams/${team.slug}/manage`}
              className="shrink-0 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-xs text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Manage Team
            </Link>
          ) : null}
        </div>

        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Squad</h2>
          <div className="space-y-2">
            {roster.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-brand)]/20 text-xs font-bold uppercase text-[var(--accent-brand)]">
                    {member.user.username.slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{member.user.username}</span>
                </div>
                <span
                  className={`rounded border px-2 py-0.5 text-xs ${
                    member.role === "OWNER"
                      ? "border-[var(--accent-brand)]/35 text-[var(--accent-brand)]"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {member.role === "OWNER" ? "Owner" : "Member"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
