"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name.trim() || !shortName.trim()) {
      setError("Name and short name are required");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, shortName, city }),
      });

      const body = (await res.json()) as { success?: boolean; error?: string; data?: { id: string } };
      if (!res.ok || !body.success || !body.data?.id) {
        setError(body.error ?? "Failed to create team");
        return;
      }

      router.push(`/teams/${body.data.id}`);
    } catch {
      setError("Failed to create team");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-xl space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">Create Team</h1>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">Team Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">Short Name</span>
        <input
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--text-secondary)]">City</span>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[var(--text-primary)]"
        />
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Creating..." : "Create Team"}
      </button>
    </form>
  );
}
