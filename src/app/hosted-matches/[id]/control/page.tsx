"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type HostedMatch = {
  id: string;
  slug: string;
  title: string;
  status: string;
  teamA: { name: string };
  teamB: { name: string };
};

export default function HostedMatchControlPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [hostedMatch, setHostedMatch] = useState<HostedMatch | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [memberRole, setMemberRole] = useState("SCORER");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const res = await fetch(`/api/hosted-matches/${id}`, { cache: "no-store" });
      const body = (await res.json()) as { data?: HostedMatch };
      if (!cancelled) setHostedMatch(body.data ?? null);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function startHostedMatch() {
    setMessage(null);
    const res = await fetch(`/api/hosted-matches/${id}/start`, { method: "POST" });
    const body = (await res.json()) as { success?: boolean; error?: string; data?: { matchCenterUrl?: string } };
    if (!res.ok || !body.success) {
      setMessage(body.error ?? "Failed to start match");
      return;
    }
    setMessage(`Match started. Open ${body.data?.matchCenterUrl ?? "match center"}`);
  }

  async function addMember(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    const res = await fetch(`/api/hosted-matches/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, role: memberRole }),
    });

    const body = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok || !body.success) {
      setMessage(body.error ?? "Failed to add member");
      return;
    }

    setIdentifier("");
    setMessage("Member access granted");
  }

  if (!hostedMatch) {
    return <p className="text-sm text-[var(--text-secondary)]">Loading hosted match...</p>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{hostedMatch.title}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{hostedMatch.teamA.name} vs {hostedMatch.teamB.name}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Status: {hostedMatch.status}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={startHostedMatch} className="rounded-md bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white">
            Start Live Match
          </button>
          <Link href={`/hosted-matches/${id}/score`} className="rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-primary)]">
            Open Scoring Console
          </Link>
          <Link href={`/match/${hostedMatch.slug}`} className="rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-primary)]">
            Open Match Center
          </Link>
        </div>
      </div>

      <form onSubmit={addMember} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Scorer / Operator Access</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Grant scoring controls to authenticated users.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="username or email"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)} className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]">
            <option value="SCORER">SCORER</option>
            <option value="OPERATOR">OPERATOR</option>
          </select>
          <button type="submit" className="rounded-md bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white">
            Add
          </button>
        </div>
      </form>

      {message ? <p className="text-sm text-[var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
