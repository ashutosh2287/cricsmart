"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  userId: string;
  role: string;
  user: { id: string; username: string; avatarUrl: string | null };
};

type Team = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  ownerId: string;
  members: Member[];
};

type Props = { team: Team; currentUserId: string };

export function ManageTeamClient({ team, currentUserId }: Props) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleRemoveMember(userId: string) {
    setRemoving(userId);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${team.slug}/members/${userId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to remove member");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setRemoving(null);
    }
  }

  async function handleDeleteTeam() {
    const shouldDelete = window.confirm(`Delete "${team.name}" permanently? This cannot be undone.`);
    if (!shouldDelete) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to delete team");
        return;
      }

      router.push("/account/teams");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : null}

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Squad — {team.members.length} members
        </h2>
        <div className="space-y-2">
          {team.members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-brand)]/20 text-xs font-bold uppercase text-[var(--accent-brand)]">
                  {member.user.username.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{member.user.username}</p>
                  <p className="text-xs text-[var(--text-muted)]">{member.role === "OWNER" ? "Owner" : "Member"}</p>
                </div>
              </div>

              {member.userId !== currentUserId ? (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={removing === member.userId || deleting}
                  className="rounded-lg border border-red-500/25 px-3 py-1.5 text-xs text-red-400 transition hover:border-red-500/45 hover:text-red-300 disabled:opacity-40"
                >
                  {removing === member.userId ? "Removing..." : "Remove"}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-red-500/25 p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-red-400">Danger Zone</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Delete this team</p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Permanently removes the team and all memberships.</p>
          </div>
          <button
            onClick={handleDeleteTeam}
            disabled={deleting || removing !== null}
            className="rounded-lg border border-red-500/35 px-4 py-2 text-xs text-red-400 transition hover:border-red-500/60 hover:text-red-300 disabled:opacity-40"
          >
            {deleting ? "Deleting..." : "Delete Team"}
          </button>
        </div>
      </section>
    </div>
  );
}
