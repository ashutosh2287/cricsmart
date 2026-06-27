import { notFound, redirect } from "next/navigation";
import { getTeamBySlug } from "@/lib/repositories/team.repository";
import { getRequestAuthSession } from "@/services/auth/serverRequestContext";
import { ManageTeamClient } from "./ManageTeamClient";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Manage Team — CricLens" };

export default async function ManageTeamPage({ params }: Props) {
  const { slug } = await params;
  const session = await getRequestAuthSession();
  if (!session) redirect(`/login?redirect=/teams/${slug}/manage`);

  const team = await getTeamBySlug(slug);
  if (!team) notFound();

  if (team.ownerId !== session.userId) {
    redirect(`/teams/${team.slug}`);
  }

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
        user: member.user!,
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
          user: member.user!,
        })),
      ];

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">Team Management</p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Manage {team.name}</h1>
        </div>
        <ManageTeamClient
          team={{
            id: team.id,
            name: team.name,
            slug: team.slug,
            description: team.description,
            visibility: team.visibility,
            ownerId: team.ownerId,
            members: roster,
          }}
          currentUserId={session.userId}
        />
      </div>
    </main>
  );
}
