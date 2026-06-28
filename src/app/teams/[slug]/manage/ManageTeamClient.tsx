"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Member = {
  userId: string;
  role: string;
  user: { id: string; username: string; avatarUrl: string | null };
};

type SquadMember = {
  id: string;
  name: string;
  jerseyNo: number | null;
  role: string;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [loadingSquad, setLoadingSquad] = useState(true);
  const [adding, setAdding] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [playerJerseyNo, setPlayerJerseyNo] = useState("");
  const [playerRole, setPlayerRole] = useState("BAT");

  useEffect(() => {
    let cancelled = false;

    async function loadSquad() {
      setLoadingSquad(true);
      try {
        const res = await fetch(`/api/teams/${team.slug}/squad`, { cache: "no-store" });
        const data = (await res.json()) as { squad?: SquadMember[]; error?: string };
        if (!cancelled) {
          if (!res.ok) {
            setError(data.error ?? "Failed to load squad");
            setSquad([]);
            return;
          }
          setSquad(data.squad ?? []);
        }
      } catch {
        if (!cancelled) setError("Failed to load squad");
      } finally {
        if (!cancelled) setLoadingSquad(false);
      }
    }

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
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${team.slug}`, { method: "DELETE" });
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

  async function handleAddSquadPlayer() {
    setError(null);
    const name = playerName.trim();
    if (!name) {
      setError("Player name is required");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`/api/teams/${team.slug}/squad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          jerseyNo: playerJerseyNo.trim() ? Number(playerJerseyNo) : null,
          role: playerRole,
        }),
      });

      const data = (await res.json()) as { member?: SquadMember; error?: string };
      if (!res.ok || !data.member) {
        setError(data.error ?? "Failed to add player");
        return;
      }

      const createdMember = data.member;
      setSquad((prev) => [...prev, createdMember]);
      setPlayerName("");
      setPlayerJerseyNo("");
      setPlayerRole("BAT");
    } catch {
      setError("Failed to add player");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveSquadPlayer(memberId: string) {
    setError(null);
    const res = await fetch(`/api/teams/${team.slug}/squad/${memberId}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to remove player");
      return;
    }

    setSquad((prev) => prev.filter((member) => member.id !== memberId));
  }

  async function handleEditSquadPlayer(member: SquadMember) {
    const name = window.prompt("Player name", member.name);
    if (name === null) return;

    const role = window.prompt("Player role", member.role);
    if (role === null) return;

    const jerseyNoInput = window.prompt(
      "Jersey number (leave empty for none)",
      member.jerseyNo === null ? "" : String(member.jerseyNo)
    );
    if (jerseyNoInput === null) return;

    const jerseyNo = jerseyNoInput.trim() ? Number(jerseyNoInput) : null;

    const res = await fetch(`/api/teams/${team.slug}/squad/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), role: role.trim(), jerseyNo }),
    });

    const data = (await res.json()) as { member?: SquadMember; error?: string };
    if (!res.ok || !data.member) {
      setError(data.error ?? "Failed to update player");
      return;
    }

    setSquad((prev) => prev.map((player) => (player.id === data.member!.id ? data.member! : player)));
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : null}

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Team Members — {team.members.length}
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

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Squad Players — {squad.length}
        </h2>

        <div className="mb-3 grid gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:grid-cols-[1fr_auto_auto_auto]">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Player name"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <input
            value={playerJerseyNo}
            onChange={(e) => setPlayerJerseyNo(e.target.value)}
            placeholder="Jersey #"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <select
            aria-label="Squad role"
            value={playerRole}
            onChange={(e) => setPlayerRole(e.target.value)}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="BAT">BAT</option>
            <option value="BOWL">BOWL</option>
            <option value="AR">AR</option>
            <option value="WK">WK</option>
          </select>
          <button
            type="button"
            onClick={handleAddSquadPlayer}
            disabled={adding}
            className="rounded-md bg-[var(--accent-brand)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </div>

        {loadingSquad ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading squad...</p>
        ) : (
          <div className="space-y-2">
            {squad.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {member.jerseyNo !== null ? `#${member.jerseyNo} ` : ""}
                    {member.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{member.role}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditSquadPlayer(member)}
                    className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSquadPlayer(member.id)}
                    className="rounded-lg border border-red-500/25 px-3 py-1.5 text-xs text-red-400"
                  >
                    Remove
                  </button>
                </div>
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
            onClick={() => setShowDeleteModal(true)}
            disabled={deleting || removing !== null}
            className="rounded-lg border border-red-500/35 px-4 py-2 text-xs text-red-400 transition hover:border-red-500/60 hover:text-red-300 disabled:opacity-40"
          >
            Delete Team
          </button>
        </div>
      </section>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete Team"
        message={`Delete "${team.name}" permanently? This cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        danger
        onConfirm={handleDeleteTeam}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}