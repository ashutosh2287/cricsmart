"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { userId: string };

export function CreateTeamForm({ userId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          visibility,
          userId,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        team?: { slug?: string; id?: string };
        data?: { slug?: string; id?: string };
      };

      if (!res.ok) {
        setError(data.error ?? "Failed to create team");
        return;
      }

      const slug = data.team?.slug ?? data.data?.slug ?? data.team?.id ?? data.data?.id;
      if (!slug) {
        setError("Team created but redirect failed. Open My Teams to continue.");
        return;
      }

      router.push(`/teams/${slug}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-secondary)]">
          Team Name <span className="text-[var(--accent-brand)]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Mumbai Tigers"
          required
          minLength={2}
          maxLength={50}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-brand)] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-secondary)]">
          Description
          <span className="ml-2 text-[var(--text-muted)] normal-case tracking-normal">optional</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell people about your team..."
          maxLength={300}
          rows={3}
          className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-brand)] focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-[var(--text-muted)]">{description.length}/300</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.13em] text-[var(--text-secondary)]">
          Visibility
        </label>
        <div className="flex gap-3">
          {(["PUBLIC", "PRIVATE"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setVisibility(value)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${
                visibility === value
                  ? "border-[var(--accent-brand)] bg-[var(--accent-brand)]/10 text-[var(--accent-brand)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
              }`}
            >
              {value === "PUBLIC" ? "🌐 Public" : "🔒 Private"}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          {visibility === "PUBLIC" ? "Anyone can view this team's page." : "Only members can view this team."}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={loading || name.trim().length < 2}
        className="w-full rounded-lg bg-[var(--accent-brand)] py-3 text-sm font-bold text-[#ffffff] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Team"}
      </button>
    </form>
  );
}
