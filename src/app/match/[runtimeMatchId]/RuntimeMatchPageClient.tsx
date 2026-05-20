"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import LiveCommentaryFeed from "@/components/LiveCommentaryFeed";
import ReplaySlider from "@/components/match/ReplaySlider";
import { connectRealtime, disconnectRealtime } from "@/services/realtime/connectRealtime";
import { useCurrentBatters, useScore } from "@/services/matchSelectors";

type Props = {
  runtimeMatchId: string;
};

export default function RuntimeMatchPageClient({ runtimeMatchId }: Props) {
  const score = useScore(runtimeMatchId);
  const batters = useCurrentBatters(runtimeMatchId);
  const subscriberId = useMemo(
    () => `match-runtime-page-${runtimeMatchId}`,
    [runtimeMatchId]
  );

  useEffect(() => {
    connectRealtime(runtimeMatchId, subscriberId, { autoStartSimulation: false });
    return () => {
      disconnectRealtime(runtimeMatchId, subscriberId);
    };
  }, [runtimeMatchId, subscriberId]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 text-[var(--text-primary)]">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Match Center</h1>
        <Link href="/matches" className="text-sm text-[var(--text-secondary)] hover:underline">
          Back to matches
        </Link>
      </div>

      <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Runtime Match ID</p>
        <p className="mt-1 font-mono text-sm">{runtimeMatchId}</p>
        <p className="mt-3 text-3xl font-bold tabular-nums">
          {score.runs}/{score.wickets}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">Overs: {score.overs}</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          striker: {batters?.striker || "—"} · non-striker: {batters?.nonStriker || "—"}
        </p>
      </section>

      <ReplaySlider matchId={runtimeMatchId} />
      <LiveCommentaryFeed matchId={runtimeMatchId} />
    </main>
  );
}
