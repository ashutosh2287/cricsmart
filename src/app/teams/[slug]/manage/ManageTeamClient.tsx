"use client";

import { FormEvent, useEffect, useState } from "react";
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
type SquadRole = "BATSMAN" | "BOWLER" | "ALL_ROUNDER" | "WICKET_KEEPER";
type SquadMember = {
  id: string;
  name: string;
  jerseyNo: number | null;
  role: SquadRole;
};

export function ManageTeamClient({ team, currentUserId }: Props) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [squadLoading, setSquadLoading] = useState(true);
  const [squadActionId, setSquadActionId] = useState<string | null>(null);
  const [editingSquadId, setEditingSquadId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newJerseyNo, setNewJerseyNo] = useState("");
  const [newRole, setNewRole] = useState<SquadRole>("BATSMAN");
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editJerseyNo, setEditJerseyNo] = useState("");
  const [editRole, setEditRole] = useState<SquadRole>("BATSMAN");

  useEffect(() => {
    let cancelled = false;
    const loadSquad = async () => {
      setSquadLoading(true);
      try {
        const res = await fetch(`/api/teams/${team.slug}/squad`, { cache: "no-store" });
        const data = (await res.json()) as {
          success?: boolean;
          squad?: SquadMember[];
          error?: string;
        };
        if (!res.ok || !data.success) {
          if (!cancelled) setError(data.error ?? "Failed to load squad");
          return;
        }
        if (!cancelled) {
          setSquad(data.squad ?? []);
        }
      } catch {
        if (!cancelled) setError("Failed to load squad");
      } finally {
        if (!cancelled) setSquadLoading(false);
      }
    };
    void loadSquad();
    return () => {
      cancelled = true;
    };
  }, [team.slug]);

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
      const res = await fetch(`/api/teams/${team.slug}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to delete team");
        return;
      }

      async function handleAddSquadMember(event: FormEvent) {
        event.preventDefault();
        setError(null);
        setSquadActionId("new");

        try {
          const body: { name: string; role: SquadRole; jerseyNo?: number } = {
            name: newPlayerName.trim(),
            role: newRole,
          };
          const jerseyNoValue = newJerseyNo.trim();
          if (jerseyNoValue) body.jerseyNo = Number(jerseyNoValue);

          const res = await fetch(`/api/teams/${team.slug}/squad`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = (await res.json()) as { success?: boolean; error?: string; player?: SquadMember };
          if (!res.ok || !data.success || !data.player) {
            setError(data.error ?? "Failed to add squad member");
            return;
          }

          setSquad((prev) =>
            [...prev, data.player].sort((a, b) => {
              if (a.jerseyNo == null) return 1;
              if (b.jerseyNo == null) return -1;
              return a.jerseyNo - b.jerseyNo;
            }),
          );
          setNewPlayerName("");
          setNewJerseyNo("");
          setNewRole("BATSMAN");
        } catch {
          setError("Failed to add squad member");
        } finally {
          setSquadActionId(null);
        }
      }

      async function handleRemoveSquadMember(memberId: string) {
        setError(null);
        setSquadActionId(memberId);

        try {
          const res = await fetch(`/api/teams/${team.slug}/squad/${memberId}`, { method: "DELETE" });
          const data = (await res.json()) as { success?: boolean; error?: string };
          if (!res.ok || !data.success) {
            setError(data.error ?? "Failed to remove squad member");
            return;
          }

          setSquad((prev) => prev.filter((member) => member.id !== memberId));
          if (editingSquadId === memberId) setEditingSquadId(null);
        } catch {
          setError("Failed to remove squad member");
        } finally {
          setSquadActionId(null);
        }
      }

      function startEditing(member: SquadMember) {
        setEditingSquadId(member.id);
        setEditPlayerName(member.name);
        setEditJerseyNo(member.jerseyNo?.toString() ?? "");
        setEditRole(member.role);
        setError(null);
      }

      async function handleUpdateSquadMember(event: FormEvent) {
        event.preventDefault();
        if (!editingSquadId) return;

        setError(null);
        setSquadActionId(editingSquadId);

        try {
          const body: { name: string; role: SquadRole; jerseyNo: number | null } = {
            name: editPlayerName.trim(),
            role: editRole,
            jerseyNo: editJerseyNo.trim() ? Number(editJerseyNo) : null,
          };

          const res = await fetch(`/api/teams/${team.slug}/squad/${editingSquadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = (await res.json()) as { success?: boolean; error?: string; player?: SquadMember };
          if (!res.ok || !data.success || !data.player) {
            setError(data.error ?? "Failed to update squad member");
            return;
          }

          setSquad((prev) =>
            prev
              .map((member) => (member.id === editingSquadId ? data.player! : member))
              .sort((a, b) => {
                if (a.jerseyNo == null) return 1;
                if (b.jerseyNo == null) return -1;
                return a.jerseyNo - b.jerseyNo;
              }),
          );
          setEditingSquadId(null);
        } catch {
          setError("Failed to update squad member");
        } finally {
          setSquadActionId(null);
        }
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

      <section className="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Squad Management — {squad.length} players
        </h2>

        <form onSubmit={handleAddSquadMember} className="grid gap-2 sm:grid-cols-[1.5fr_100px_1fr_auto]">
          <input
            value={newPlayerName}
            onChange={(event) => setNewPlayerName(event.target.value)}
            placeholder="Player name"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
            required
          />
          <input
            value={newJerseyNo}
            onChange={(event) => setNewJerseyNo(event.target.value)}
            placeholder="Jersey #"
            type="number"
            min={1}
            max={99}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <select
            value={newRole}
            onChange={(event) => setNewRole(event.target.value as SquadRole)}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="BATSMAN">Batsman</option>
            <option value="BOWLER">Bowler</option>
            <option value="ALL_ROUNDER">All-Rounder</option>
            <option value="WICKET_KEEPER">Wicket Keeper</option>
          </select>
          <button
            type="submit"
            disabled={squadActionId === "new" || deleting}
            className="rounded-lg bg-[var(--accent-brand)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            {squadActionId === "new" ? "Adding..." : "Add"}
          </button>
        </form>

        {squadLoading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading squad...</p>
        ) : squad.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No squad players yet.</p>
        ) : (
          <div className="space-y-2">
            {squad.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3"
              >
                {editingSquadId === member.id ? (
                  <form onSubmit={handleUpdateSquadMember} className="grid gap-2 sm:grid-cols-[1.5fr_100px_1fr_auto_auto]">
                    <input
                      value={editPlayerName}
                      onChange={(event) => setEditPlayerName(event.target.value)}
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      required
                    />
                    <input
                      value={editJerseyNo}
                      onChange={(event) => setEditJerseyNo(event.target.value)}
                      type="number"
                      min={1}
                      max={99}
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
                    />
                    <select
                      value={editRole}
                      onChange={(event) => setEditRole(event.target.value as SquadRole)}
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
                    >
                      <option value="BATSMAN">Batsman</option>
                      <option value="BOWLER">Bowler</option>
                      <option value="ALL_ROUNDER">All-Rounder</option>
                      <option value="WICKET_KEEPER">Wicket Keeper</option>
                    </select>
                    <button
                      type="submit"
                      disabled={squadActionId === member.id}
                      className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSquadId(null)}
                      className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)]"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{member.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        #{member.jerseyNo ?? "—"} · {member.role.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(member)}
                        className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSquadMember(member.id)}
                        disabled={squadActionId === member.id}
                        className="rounded-lg border border-red-500/25 px-3 py-1.5 text-xs text-red-400 disabled:opacity-40"
                      >
                        {squadActionId === member.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
