"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Team = { id: string; name: string; shortName: string };

export default function HostMatchCreatePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("T20");
  const [venue, setVenue] = useState("");
  const [startTime, setStartTime] = useState("");
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadTeams = async () => {
      try {
        const res = await fetch("/api/teams", { cache: "no-store" });
        const body = (await res.json()) as { data?: Team[] };
        if (!cancelled) setTeams(Array.isArray(body.data) ? body.data : []);
      } catch {
        if (!cancelled) setTeams([]);
      }
    };

    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/hosted-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          format,
          venue,
          startTime,
          teamAId,
          teamBId,
        }),
      });

      const body = (await res.json()) as { success?: boolean; error?: string; data?: { id: string } };
      if (!res.ok || !body.success || !body.data?.id) {
        setError(body.error ?? "Failed to create hosted match");
        return;
      }

      router.push(`/hosted-matches/${body.data.id}/control`);
    } catch {
      setError("Failed to create hosted match");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Host Match</h1>
      <p className="text-sm text-[var(--text-secondary)]">Select teams and create a hosted match orchestration layer.</p>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">Match Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Team A</span>
          <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]">
            <option value="">Select Team A</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Team B</span>
          <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]">
            <option value="">Select Team B</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Format</span>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]">
            <option value="T20">T20</option>
            <option value="ODI">ODI</option>
            <option value="TEST">TEST</option>
          </select>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-[var(--text-secondary)]">Venue</span>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]" />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">Start Time</span>
        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]" />
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button type="submit" disabled={busy} className="rounded-md bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-[#ffffff] disabled:opacity-60">
        {busy ? "Creating..." : "Create Hosted Match"}
      </button>
    </form>
  );
}
