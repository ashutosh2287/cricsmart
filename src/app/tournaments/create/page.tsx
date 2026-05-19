"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTournamentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [format, setFormat] = useState("T20");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          format,
          location,
          startDate,
          endDate,
        }),
      });

      const body = (await res.json()) as { success?: boolean; error?: string; data?: { id: string } };
      if (!res.ok || !body.success || !body.data?.id) {
        setError(body.error ?? "Failed to create tournament");
        return;
      }

      router.push(`/tournaments/${body.data.id}`);
    } catch {
      setError("Failed to create tournament");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Create Tournament</h1>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tournament Name" className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]" />
      <input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="Format" className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]" />
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]" />
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]" />
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]" />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button type="submit" disabled={busy} className="rounded-md bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Creating..." : "Create Tournament"}
      </button>
    </form>
  );
}
