"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ApiMatch = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: "LIVE" | "UPCOMING" | "COMPLETED";
};

type Match = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: "Live" | "Upcoming" | "Completed";
};

const statusTone: Record<Match["status"], string> = {
  Live: "text-red-300",
  Upcoming: "text-sky-300",
  Completed: "text-zinc-400",
};

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch("/api/matches");
        const data: ApiMatch[] = await res.json();

        const normalized: Match[] = data.map((m) => {
          let status: Match["status"];
          if (m.status === "LIVE") status = "Live";
          else if (m.status === "COMPLETED") status = "Completed";
          else status = "Upcoming";

          return {
            matchId: m.matchId,
            teamA: m.teamA,
            teamB: m.teamB,
            status,
          };
        });

        if (mounted) setMatches(normalized);
      } catch (err) {
        console.error("❌ Failed to fetch matches", err);
      }
    };

    load();
    const interval = setInterval(load, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const quickAdminMatch = useMemo(
    () =>
      matches.find((m) => m.status === "Live") ||
      matches.find((m) => m.status === "Upcoming") ||
      matches[0],
    [matches]
  );

  const liveCount = matches.filter((m) => m.status === "Live").length;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <section className="ui-section">
          <div className="ui-section-header">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-sky-300/80">
                CricSmart Console
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
                Real-Time Cricket Intelligence
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <span className="live-pulse-red" />
              {liveCount} Live
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="ui-inset">
              <p className="text-[11px] uppercase tracking-[0.15em] text-white/50">Matches</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{matches.length}</p>
            </div>
            <div className="ui-inset">
              <p className="text-[11px] uppercase tracking-[0.15em] text-white/50">Live</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-red-300">{liveCount}</p>
            </div>
            <div className="ui-inset">
              <p className="text-[11px] uppercase tracking-[0.15em] text-white/50">Upcoming</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-sky-300">
                {matches.filter((m) => m.status === "Upcoming").length}
              </p>
            </div>
            <div className="ui-inset">
              <p className="text-[11px] uppercase tracking-[0.15em] text-white/50">Completed</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-400">
                {matches.filter((m) => m.status === "Completed").length}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/matches" className="rounded-md bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950">
              View Matches
            </Link>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/create-match", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ teamA: "Team A", teamB: "Team B" }),
                  });
                  const data = await res.json();
                  if (!data?.matchId) throw new Error("Match creation failed");
                  router.push(`/admin/${data.matchId}`);
                } catch (err) {
                  console.error("❌ ERROR:", err);
                }
              }}
              className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.08]"
            >
              Create Match
            </button>
            {quickAdminMatch ? (
              <Link
                href={`/admin/${quickAdminMatch.matchId}`}
                className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.08]"
              >
                Open Admin Panel
              </Link>
            ) : null}
          </div>
        </section>

        <section className="mt-4 ui-section">
          <div className="ui-section-header">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">Live Board</h2>
          </div>
          {matches.length === 0 ? (
            <p className="text-sm text-white/50">No matches available</p>
          ) : (
            <div className="space-y-1">
              {matches.slice(0, 6).map((match) => (
                <Link
                  key={match.matchId}
                  href={`/match/${match.matchId}`}
                  className="ui-row hover:bg-white/[0.04]"
                >
                  <span className="truncate text-sm text-white">{match.teamA} vs {match.teamB}</span>
                  <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${statusTone[match.status]}`}>
                    {match.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
