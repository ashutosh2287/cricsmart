"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CuratedDiscoveryPayload, CuratedMatch } from "@/services/matches/types";
import { MatchRail } from "@/components/matches/MatchRail";
import { MatchSection } from "@/components/matches/MatchSection";
import { MatchCardCompact } from "@/components/matches/MatchCardCompact";
import { FeaturedSeriesStrip } from "@/components/matches/FeaturedSeriesStrip";

type MatchStatus = "LIVE" | "UPCOMING" | "COMPLETED";

type SimMatch = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: MatchStatus;
  type: string;
  externalMatchId?: string;
  score?: string;
  overDisplay?: string;
  commentaryPreview?: string;
};

const FIXTURE_POLL_INTERVAL_MS = 60_000;
const SIM_POLL_INTERVAL_MS = 5_000;

const EMPTY_DISCOVERY: CuratedDiscoveryPayload = {
  success: false,
  source: "live",
  updatedAt: new Date(0).toISOString(),
  data: [],
  sections: {
    live: [],
    upcoming: [],
    recent: [],
    featured: [],
  },
};

function toPayload(payload: unknown): CuratedDiscoveryPayload {
  if (!payload || typeof payload !== "object") return EMPTY_DISCOVERY;
  const record = payload as Partial<CuratedDiscoveryPayload>;
  const sectionSource =
    record.curatedSections && typeof record.curatedSections === "object"
      ? record.curatedSections
      : record.sections && typeof record.sections === "object"
        ? record.sections
        : undefined;
  return {
    success: Boolean(record.success),
    source: record.source === "cache" || record.source === "stale" ? record.source : "live",
    stale: Boolean(record.stale),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString(),
    data: Array.isArray(record.data) ? (record.data as CuratedMatch[]) : [],
    sections:
      sectionSource
        ? {
            live: Array.isArray(sectionSource.live) ? (sectionSource.live as CuratedMatch[]) : [],
            upcoming: Array.isArray(sectionSource.upcoming) ? (sectionSource.upcoming as CuratedMatch[]) : [],
            recent: Array.isArray(sectionSource.recent) ? (sectionSource.recent as CuratedMatch[]) : [],
            featured: Array.isArray(sectionSource.featured) ? (sectionSource.featured as CuratedMatch[]) : [],
          }
        : EMPTY_DISCOVERY.sections,
    error: typeof record.error === "string" ? record.error : undefined,
  };
}

export default function MatchesPage() {
  const [discovery, setDiscovery] = useState<CuratedDiscoveryPayload>(EMPTY_DISCOVERY);
  const [realLoading, setRealLoading] = useState(true);

  const [simMatches, setSimMatches] = useState<SimMatch[]>([]);
  const [simLoading, setSimLoading] = useState(true);

  const discoverySnapshotRef = useRef<CuratedDiscoveryPayload>(EMPTY_DISCOVERY);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/live/fixtures", { cache: "no-store" });
        const payload = toPayload(await res.json());
        if (cancelled) return;

        setDiscovery(payload);
        discoverySnapshotRef.current = payload;
      } catch {
        if (cancelled) return;
        const snapshot = discoverySnapshotRef.current;
        if (snapshot.data.length > 0) {
          setDiscovery({ ...snapshot, stale: true, source: "stale" });
        } else {
          setDiscovery({ ...EMPTY_DISCOVERY, stale: true });
        }
      } finally {
        if (!cancelled) setRealLoading(false);
      }
    };

    load();
    const timer = setInterval(load, FIXTURE_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/matches", { cache: "no-store" });
        const data = (await res.json()) as SimMatch[];
        if (!cancelled) setSimMatches(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSimMatches([]);
      } finally {
        if (!cancelled) setSimLoading(false);
      }
    };

    load();
    const timer = setInterval(load, SIM_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const sections = useMemo(() => discovery.sections, [discovery]);

  useEffect(() => {
    console.debug("MATCHES_CURATED_SECTIONS", {
      keys: Object.keys(sections),
      counts: {
        live: sections.live.length,
        upcoming: sections.upcoming.length,
        recent: sections.recent.length,
        featured: sections.featured.length,
      },
    });
  }, [sections]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 text-white md:px-6">
      <h1 className="text-xl font-bold tracking-tight text-zinc-100 md:text-2xl">Matches</h1>

      {discovery.stale && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-900/30 px-3 py-2 text-xs text-amber-300">
          Scores may be delayed
        </div>
      )}

      <MatchSection title="LIVE NOW" subtitle="Auto-refresh: 60s">
        {realLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/70" />
            ))}
          </div>
        ) : (
          <MatchRail matches={sections.live} />
        )}
      </MatchSection>

      <MatchSection title="UPCOMING MATCHES">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500">No upcoming matches in curated sections.</p>
          ) : (
            sections.upcoming.map((match) => <MatchCardCompact key={`upcoming-${match.id}`} match={match} />)
          )}
        </div>
      </MatchSection>

      <MatchSection title="RECENT RESULTS">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.recent.length === 0 ? (
            <p className="text-sm text-zinc-500">No recent results in curated sections.</p>
          ) : (
            sections.recent.map((match) => <MatchCardCompact key={`recent-${match.id}`} match={match} />)
          )}
        </div>
      </MatchSection>

      <MatchSection title="FEATURED SERIES">
        <FeaturedSeriesStrip matches={sections.featured} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.featured.length === 0 ? (
            <p className="text-sm text-zinc-500">No featured matches in curated sections.</p>
          ) : (
            sections.featured.map((match) => <MatchCardCompact key={`featured-${match.id}`} match={match} />)
          )}
        </div>
      </MatchSection>

      <MatchSection title="YOUR SIMULATIONS">
        {simLoading ? (
          <p className="text-sm text-zinc-400">Loading simulations...</p>
        ) : simMatches.length === 0 ? (
          <p className="text-sm text-zinc-500">No simulations available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {simMatches.map((match) => {
              const isLive = match.status === "LIVE";

              return (
                <button
                  key={match.matchId}
                  onClick={async () => {
                    await fetch("/api/match/init", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        matchId: match.matchId,
                        teamA: match.teamA,
                        teamB: match.teamB,
                        type: match.type,
                        externalMatchId: match.externalMatchId ?? match.matchId,
                      }),
                    });
                    router.push(`/match/${match.matchId}`);
                  }}
                  className="rounded-lg border border-white/10 bg-zinc-900/70 p-3 text-left transition-colors hover:border-white/20"
                >
                  <p className="text-sm font-semibold text-zinc-100">
                    {match.teamA} vs {match.teamB}
                  </p>
                  <p
                    className={`mt-1 text-xs font-medium uppercase tracking-wide ${
                      isLive ? "text-red-300" : match.status === "UPCOMING" ? "text-blue-300" : "text-zinc-400"
                    }`}
                  >
                    {match.status}
                  </p>
                  {isLive ? (
                    <p className="mt-2 text-xs font-mono text-zinc-300">
                      {match.score ?? "0/0"} ({match.overDisplay ?? "0.0"})
                    </p>
                  ) : null}
                  {match.commentaryPreview ? (
                    <p className="mt-2 line-clamp-1 text-xs text-zinc-500 italic">{match.commentaryPreview}</p>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </MatchSection>
    </div>
  );
}
