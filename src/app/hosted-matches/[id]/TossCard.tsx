"use client";

import { useMemo, useState } from "react";

type TeamLite = { id: string; name: string };

type Props = {
  matchId: string;
  teamA: TeamLite;
  teamB: TeamLite;
  onTossSet: () => void;
};

export function TossCard({ matchId, teamA, teamB, onTossSet }: Props) {
  const [tossWinner, setTossWinner] = useState("");
  const [decision, setDecision] = useState<"BAT" | "BOWL">("BAT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const battingTeam = useMemo(() => {
    if (!tossWinner) return "—";
    if (decision === "BAT") return tossWinner === teamA.id ? teamA.name : teamB.name;
    return tossWinner === teamA.id ? teamB.name : teamA.name;
  }, [decision, teamA.id, teamA.name, teamB.id, teamB.name, tossWinner]);

  async function handleSaveToss() {
    if (!tossWinner || saving) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/hosted-matches/${matchId}/toss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tossWinnerId: tossWinner, tossDecision: decision }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save toss");
        return;
      }

      onTossSet();
    } catch {
      setError("Failed to save toss");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Toss</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Set toss winner and decision before selecting Playing XI.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Toss Winner</span>
          <select
            value={tossWinner}
            onChange={(e) => setTossWinner(e.target.value)}
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
          >
            <option value="">Select team</option>
            <option value={teamA.id}>{teamA.name}</option>
            <option value={teamB.id}>{teamB.name}</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Decision</span>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value as "BAT" | "BOWL")}
            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
          >
            <option value="BAT">Bat</option>
            <option value="BOWL">Bowl</option>
          </select>
        </label>
      </div>

      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Batting first: <span className="font-medium text-[var(--text-primary)]">{battingTeam}</span>
      </p>

      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={handleSaveToss}
        disabled={saving || !tossWinner}
        className="mt-4 rounded-md bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Toss"}
      </button>
    </section>
  );
}
