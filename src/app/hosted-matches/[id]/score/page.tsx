"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ScoringConsole } from "../ScoringConsole";

export default function HostedMatchScorePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [message, setMessage] = useState<string | null>(null);
  const [runtimeMatchId, setRuntimeMatchId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const res = await fetch(`/api/hosted-matches/${id}`, { cache: "no-store" });
      const body = (await res.json()) as { data?: { runtimeMatchId?: string | null } };
      if (!cancelled) {
        setRuntimeMatchId(body.data?.runtimeMatchId ?? null);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function startHostedMatch() {
    setMessage(null);

    const res = await fetch(`/api/matches/${id}/start`, { method: "POST" });
    const body = (await res.json()) as {
      success?: boolean;
      error?: string;
      runtimeMatchId?: string;
      data?: { runtimeMatchId?: string };
    };

    if (!res.ok || !body.success) {
      setMessage(body.error ?? "Failed to start match");
      return;
    }

    const runtime = body.runtimeMatchId ?? body.data?.runtimeMatchId ?? null;
    setRuntimeMatchId(runtime);
    setMessage("Match started");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Scoring Console</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Submit ball-by-ball events using the selected Playing XI.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={startHostedMatch}
            disabled={Boolean(runtimeMatchId)}
            className="rounded-md bg-[var(--accent-brand)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start Match
          </button>

          {runtimeMatchId ? (
            <Link
              href={`/match/${runtimeMatchId}`}
              className="rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-primary)]"
            >
              Open Match Center
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-secondary)] opacity-70"
            >
              Open Match Center
            </button>
          )}
        </div>

        {message ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{message}</p> : null}
      </div>

      {runtimeMatchId ? (
        <ScoringConsole matchId={runtimeMatchId} hostedMatchId={id} />
      ) : (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-secondary)]">
          Start the match to open the scoring controls.
        </div>
      )}
    </div>
  );
}
