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
  sessionState?: string;
};

const FIXTURE_POLL_INTERVAL_MS = 5 * 60_000;
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
  const [deletingSimulationId, setDeletingSimulationId] = useState<string | null>(null);

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

  const handleDeleteSimulation = async (matchId: string) => {
    setDeletingSimulationId(matchId);
    try {
      const res = await fetch("/api/matches/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (!res.ok) {
        const details = await res.text().catch(() => "");
        throw new Error(
          `Failed to delete simulation ${matchId}. status=${res.status} details=${details}`
        );
      }
      setSimMatches((prev) => prev.filter((match) => match.matchId !== matchId));
    } catch (error) {
      console.error("Failed to delete simulation", { matchId, error });
    } finally {
      setDeletingSimulationId(null);
    }
  };

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
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-5 text-[var(--text-primary)] md:px-4">
      <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] md:text-2xl">Matches</h1>

      {discovery.stale && (
        <div
          className="rounded-lg px-3 py-2 text-xs"
          style={{
            border: "1px solid color-mix(in srgb, var(--accent-amber) 35%, transparent)",
            background: "color-mix(in srgb, var(--accent-amber) 16%, transparent)",
            color: "var(--accent-amber)",
          }}
        >
          Scores may be delayed
        </div>
      )}

      <MatchSection title="LIVE NOW" subtitle="Auto-refresh: 5m">
        {realLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="hierarchy-tertiary h-24 animate-pulse rounded-lg"
                style={{
                  background: "color-mix(in srgb, var(--bg-surface) 88%, transparent)",
                }}
              />
              ))}
            </div>
          ) : (
          <MatchRail matches={sections.live} />
        )}
      </MatchSection>

      <MatchSection title="UPCOMING MATCHES">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.upcoming.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No upcoming matches in curated sections.</p>
          ) : (
            sections.upcoming.map((match) => <MatchCardCompact key={`upcoming-${match.id}`} match={match} />)
          )}
        </div>
      </MatchSection>

      <MatchSection title="RECENT RESULTS">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.recent.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No recent results in curated sections.</p>
          ) : (
            sections.recent.map((match) => <MatchCardCompact key={`recent-${match.id}`} match={match} />)
          )}
        </div>
      </MatchSection>

      <MatchSection title="FEATURED SERIES">
        <FeaturedSeriesStrip matches={sections.featured} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sections.featured.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No featured matches in curated sections.</p>
          ) : (
            sections.featured.map((match) => <MatchCardCompact key={`featured-${match.id}`} match={match} />)
          )}
        </div>
      </MatchSection>

      <MatchSection title="YOUR SIMULATIONS">
        {simLoading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading simulations...</p>
        ) : simMatches.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No simulations available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {simMatches.map((match) => {
              const isLive = match.status === "LIVE";
              const isDeleting = deletingSimulationId === match.matchId;

              return (
                <div
                  key={match.matchId}
                  className="grid grid-cols-[1fr_auto] items-start rounded-lg"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    background: "color-mix(in srgb, var(--bg-surface) 92%, transparent)",
                  }}
                >
                  <button
                    onClick={async () => {
                      if (match.type === "LIVE") {
                        router.push(`/match/${match.matchId}`);
                        return;
                      }

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
                    className="w-full p-3 text-left transition-colors"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {match.teamA} vs {match.teamB}
                    </p>
                  <p
                    className={`mt-1 text-xs font-medium uppercase tracking-wide ${
                        isLive
                          ? "text-[var(--accent-live)]"
                          : match.status === "UPCOMING"
                            ? "text-[var(--accent-brand)]"
                            : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {match.status}
                    </p>
                    {isLive ? (
                      <p className="mt-2 text-xs font-mono text-[var(--text-secondary)]">
                        {match.score ?? "0/0"} ({match.overDisplay ?? "0.0"})
                      </p>
                    ) : null}
                    {match.commentaryPreview ? (
                      <p className="mt-2 line-clamp-1 text-xs italic text-[var(--text-muted)]">
                        {match.commentaryPreview}
                      </p>
                    ) : null}
                  </button>
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteSimulation(match.matchId)}
                      disabled={isDeleting}
                      aria-busy={isDeleting}
                      aria-label={
                        isDeleting
                          ? `Deleting simulation ${match.teamA} vs ${match.teamB}`
                          : `Delete simulation ${match.teamA} vs ${match.teamB}`
                      }
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors disabled:opacity-50"
                      style={{
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-overlay)",
                        color: "var(--text-muted)",
                      }}
                      title="Delete simulation"
                    >
                      {isDeleting ? (
                        <>
                          <span aria-hidden="true">…</span>
                          <span className="sr-only">Deleting</span>
                        </>
                      ) : (
                        "✕"
                      )}
                    </button>
                  </div>
                </div>
               );
            })}
          </div>
        )}
      </MatchSection>
    </div>
  );
}