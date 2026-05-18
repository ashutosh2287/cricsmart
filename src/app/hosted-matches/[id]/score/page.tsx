"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

const EVENT_TYPES = ["RUN", "FOUR", "SIX", "WICKET", "WD", "NB", "BYE", "LB"] as const;

export default function HostedMatchScorePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]>("RUN");
  const [runs, setRuns] = useState(1);
  const [batsman, setBatsman] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submitEvent() {
    setMessage(null);

    const res = await fetch(`/api/hosted-matches/${id}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: eventType,
        runs,
        batsman,
        nonStriker,
        bowler,
      }),
    });

    const body = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok || !body.success) {
      setMessage(body.error ?? "Scoring update failed");
      return;
    }

    setMessage("Scoring event submitted");
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Scoring Console</h1>
      <p className="text-sm text-[var(--text-secondary)]">Ball-by-ball scoring publishes directly into MatchEngine and SSE.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Event Type</span>
          <select value={eventType} onChange={(e) => setEventType(e.target.value as (typeof EVENT_TYPES)[number])} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]">
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">Runs</span>
          <input type="number" value={runs} onChange={(e) => setRuns(Number(e.target.value) || 0)} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <input value={batsman} onChange={(e) => setBatsman(e.target.value)} placeholder="Batsman" className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]" />
        <input value={nonStriker} onChange={(e) => setNonStriker(e.target.value)} placeholder="Non-striker" className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]" />
        <input value={bowler} onChange={(e) => setBowler(e.target.value)} placeholder="Bowler" className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-sm text-[var(--text-primary)]" />
      </div>

      <button onClick={submitEvent} className="rounded-md bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white">
        Submit Ball Event
      </button>

      {message ? <p className="text-sm text-[var(--text-secondary)]">{message}</p> : null}
    </div>
  );
}
