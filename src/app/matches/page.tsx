"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type MatchStatus = "LIVE" | "UPCOMING" | "COMPLETED";
type MatchType = "SIMULATION" | "LIVE";
type TabType = "ALL" | MatchStatus;

type Match = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: MatchStatus;
  type: MatchType;
  externalMatchId?: string;
  score?: string;
  overDisplay?: string;
  commentaryPreview?: string;
  heartbeatFresh?: boolean;
  reconnectHealth?: "healthy" | "stale" | "disconnected";
};

type LiveFixture = {
  externalMatchId: string;
  matchId: string;
  teamA: string;
  teamB: string;
  score: string;
  status: string;
  format: string;
  series: string;
  isLive: boolean;
  lastUpdatedAt: number;
  oversStatus: string;
  providerName: string;
};

const FIXTURE_POLL_INTERVAL_MS = 20_000;
const HEARTBEAT_FRESH_THRESHOLD_MS = 45_000;
const HEARTBEAT_STALE_THRESHOLD_MS = 150_000;
const ENDED_STATUS_KEYWORDS = ["won by", "result", "abandoned", "stumps", "complete", "ended", "finished"];
const LIVE_STATUS_KEYWORDS = ["live", "in progress", "innings break", "drinks", "need", "trail", "require"];
const IPL_KEYWORDS = ["ipl", "indian premier league"];
const INTERNATIONAL_KEYWORDS = [
  "international",
  "test",
  "odi",
  "t20i",
  "icc",
  "world cup",
  "champions trophy",
  "asia cup",
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseTimestamp(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const directNumber = Number(value);
    if (Number.isFinite(directNumber) && directNumber > 0) return directNumber;
    const parsedDate = Date.parse(value);
    if (Number.isFinite(parsedDate)) return parsedDate;
  }
  return undefined;
}

function deriveLiveStatus(status: string) {
  const normalized = status.toLowerCase();
  const ended = ENDED_STATUS_KEYWORDS.some((keyword) => normalized.includes(keyword));
  const live = LIVE_STATUS_KEYWORDS.some((keyword) => normalized.includes(keyword));
  return live && !ended;
}

function extractProviderRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const data = record.data;
  if (Array.isArray(data)) return data;
  return [];
}

function parseFixtureRow(row: unknown): LiveFixture | null {
  const record = asRecord(row);
  if (!record) return null;

  const externalMatchId =
    readString(record.id) ??
    readString(record.matchId) ??
    readString(record.unique_id) ??
    readString(record.externalMatchId);
  if (!externalMatchId) return null;

  const teamInfo = Array.isArray(record.teamInfo) ? record.teamInfo : [];
  const teamInfoNames = teamInfo
    .map((entry) => readString(asRecord(entry)?.name))
    .filter((name): name is string => Boolean(name));

  const teams = Array.isArray(record.teams) ? record.teams : [];
  const teamArrayNames = teams
    .map((entry) => readString(entry))
    .filter((name): name is string => Boolean(name));

  const providerName = readString(record.name) ?? `${teamInfoNames[0] ?? "Team A"} vs ${teamInfoNames[1] ?? "Team B"}`;
  const nameParts = providerName.split(/\s+vs\s+/i).map((part) => part.trim()).filter(Boolean);

  const teamA = teamInfoNames[0] ?? teamArrayNames[0] ?? nameParts[0] ?? "Team A";
  const teamB = teamInfoNames[1] ?? teamArrayNames[1] ?? nameParts[1] ?? "Team B";

  const scoreRows = Array.isArray(record.score) ? record.score : [];
  const latestScore = asRecord(scoreRows[scoreRows.length - 1]);
  const runs = readNumber(latestScore?.r);
  const wickets = readNumber(latestScore?.w);
  const overs = readNumber(latestScore?.o);

  const score = runs !== undefined && wickets !== undefined ? `${runs}/${wickets}` : "Score unavailable";
  const oversStatus = overs !== undefined ? `${overs} ov` : "Overs unavailable";

  const status = readString(record.status) ?? readString(record.ms) ?? "LIVE";
  const format = readString(record.matchType) ?? readString(record.format) ?? "Unknown";
  const series = readString(record.series) ?? providerName;
  const isLive = deriveLiveStatus(status);
  const lastUpdatedAt =
    parseTimestamp(record.updatedAt) ??
    parseTimestamp(record.lastUpdatedAt) ??
    parseTimestamp(record.dateTimeGMT) ??
    parseTimestamp(record.date) ??
    Date.now();

  return {
    externalMatchId,
    matchId: `live-${externalMatchId}`,
    teamA,
    teamB,
    score,
    status,
    format,
    series,
    isLive,
    lastUpdatedAt,
    oversStatus,
    providerName,
  };
}

function isCurrentLiveInternationalOrIplFixture(fixture: LiveFixture) {
  if (!fixture.isLive) return false;

  const metadata = `${fixture.series} ${fixture.format} ${fixture.providerName} ${fixture.status}`.toLowerCase();
  const isIpl = IPL_KEYWORDS.some((keyword) => metadata.includes(keyword));
  const isInternational = INTERNATIONAL_KEYWORDS.some((keyword) => metadata.includes(keyword));

  return isIpl || isInternational;
}

function selectCurrentFixtures(fixtures: LiveFixture[]) {
  return fixtures
    .filter(isCurrentLiveInternationalOrIplFixture)
    .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
}

function getHeartbeatMeta(lastUpdatedAt: number) {
  const ageMs = Date.now() - lastUpdatedAt;

  if (ageMs <= HEARTBEAT_FRESH_THRESHOLD_MS) {
    return {
      text: "Heartbeat: fresh",
      badgeClass: "text-emerald-300",
      dotClass: "bg-emerald-400",
    };
  }

  if (ageMs <= HEARTBEAT_STALE_THRESHOLD_MS) {
    return {
      text: "Heartbeat: stale",
      badgeClass: "text-amber-300",
      dotClass: "bg-amber-400",
    };
  }

  return {
    text: "Heartbeat: disconnected",
    badgeClass: "text-rose-300",
    dotClass: "bg-rose-500",
  };
}

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixtures, setFixtures] = useState<LiveFixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(true);
  const [fixturesError, setFixturesError] = useState<string | null>(null);
  const [fixturesWarning, setFixturesWarning] = useState<string | null>(null);
  const [initializingByMatchId, setInitializingByMatchId] = useState<Record<string, boolean>>({});
  const [fixtureActionErrors, setFixtureActionErrors] = useState<Record<string, string>>({});
  const fixturesSnapshotRef = useRef<LiveFixture[]>([]);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const loadMatches = async () => {
      try {
        const res = await fetch("/api/matches", { cache: "no-store" });
        const data = (await res.json()) as Match[];
        if (!cancelled) {
          setMatches(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("❌ Failed to fetch matches", error);
        if (!cancelled) {
          setMatches([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMatches();
    const timer = setInterval(loadMatches, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadFixtures = async () => {
      try {
        const res = await fetch("/api/live/fixtures", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Provider request failed");
        }

        const payload = (await res.json()) as unknown;
        const providerRows = extractProviderRows(payload);
        const normalized = providerRows
          .map(parseFixtureRow)
          .filter((fixture): fixture is LiveFixture => Boolean(fixture));
        const nextFixtures = selectCurrentFixtures(normalized);

        if (cancelled) return;

        setFixtures(nextFixtures);
        fixturesSnapshotRef.current = nextFixtures;
        setFixturesError(null);
        setFixturesWarning(null);
      } catch (error) {
        console.error("❌ Failed to fetch live fixtures", error);
        if (cancelled) return;

        if (fixturesSnapshotRef.current.length > 0) {
          setFixtures(fixturesSnapshotRef.current);
          setFixturesWarning("Live provider is temporarily unavailable. Showing latest snapshot.");
          setFixturesError(null);
        } else {
          setFixturesError("Unable to load live fixtures right now.");
        }
      } finally {
        if (!cancelled) {
          setFixturesLoading(false);
        }
      }
    };

    loadFixtures();
    const timer = setInterval(loadFixtures, FIXTURE_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const filteredMatches = useMemo(() => {
    return activeTab === "ALL"
      ? matches
      : matches.filter((match) => match.status === activeTab);
  }, [activeTab, matches]);

  const openLiveMatch = async (fixture: LiveFixture) => {
    const { matchId } = fixture;
    setFixtureActionErrors((prev) => ({ ...prev, [matchId]: "" }));
    setInitializingByMatchId((prev) => ({ ...prev, [matchId]: true }));

    try {
      const registryRes = await fetch("/api/matches", { cache: "no-store" });
      if (!registryRes.ok) {
        throw new Error("Failed to check active match sessions");
      }

      const existingRows = (await registryRes.json()) as Match[];
      const alreadyInitialized = existingRows.some(
        (row) => row.matchId === matchId && row.type === "LIVE"
      );

      if (alreadyInitialized) {
        router.push(`/match/${matchId}`);
        return;
      }

      const initRes = await fetch("/api/match/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          teamA: fixture.teamA,
          teamB: fixture.teamB,
          type: "LIVE",
          externalMatchId: fixture.externalMatchId,
        }),
      });

      const initData = (await initRes.json()) as { success?: boolean; message?: string };
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.message ?? "Failed to initialize live match");
      }

      router.push(`/match/${matchId}`);
    } catch (error) {
      console.error("❌ Failed to open live match", error);
      setFixtureActionErrors((prev) => ({
        ...prev,
        [matchId]:
          error instanceof Error
            ? error.message
            : "Unable to open live match right now.",
      }));
    } finally {
      setInitializingByMatchId((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Matches</h1>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Live Fixtures Discovery</h2>
          <span className="text-xs text-gray-400">Auto-refresh: 20s</span>
        </div>

        {fixturesWarning ? (
          <p role="status" aria-live="polite" className="text-xs text-amber-300 mb-3">
            {fixturesWarning}
          </p>
        ) : null}

        {fixturesError ? (
          <p role="alert" className="text-sm text-rose-300 mb-3">
            {fixturesError}
          </p>
        ) : null}

        {fixturesLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`fixture-skeleton-${index}`}
                className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl animate-pulse"
              >
                <div className="h-5 w-2/3 bg-gray-700 rounded mb-3" />
                <div className="h-4 w-1/2 bg-gray-700 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-700 rounded mb-2" />
                <div className="h-4 w-1/3 bg-gray-700 rounded mb-4" />
                <div className="h-9 w-full bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : fixtures.length === 0 ? (
          <p className="text-gray-500">No current LIVE international/IPL fixtures found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixtures.map((fixture) => {
              const heartbeat = getHeartbeatMeta(fixture.lastUpdatedAt);
              const isInitializing = Boolean(initializingByMatchId[fixture.matchId]);
              const actionError = fixtureActionErrors[fixture.matchId];

              return (
                <div
                  key={fixture.matchId}
                  className="bg-gray-900 border border-gray-800 p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate pr-2">
                      {fixture.teamA} vs {fixture.teamB}
                    </p>
                    <span className="text-xs text-red-300 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      LIVE
                    </span>
                  </div>

                  <p className="text-lg mt-2">{fixture.score}</p>
                  <p className="text-sm text-gray-300">
                    {fixture.oversStatus} • {fixture.status}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {fixture.format.toUpperCase()} • {fixture.series}
                  </p>

                  <p className={`text-xs mt-2 flex items-center gap-2 ${heartbeat.badgeClass}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${heartbeat.dotClass}`} />
                    {heartbeat.text}
                  </p>

                  {actionError ? (
                    <p className="text-xs text-rose-300 mt-2">{actionError}</p>
                  ) : null}

                  <button
                    type="button"
                    disabled={isInitializing}
                    onClick={() => openLiveMatch(fixture)}
                    className="mt-3 w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed px-3 py-2 rounded text-sm font-medium"
                  >
                    {isInitializing ? "Initializing..." : "Open Live Match"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex gap-3 mb-6">
        {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full ${
              activeTab === tab ? "bg-purple-600" : "bg-gray-800"
            }`}
          >
            {tab === "LIVE" ? "LIVE 🔴" : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading matches...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.length === 0 ? (
            <p className="text-gray-500">No matches available</p>
          ) : (
            filteredMatches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                onClick={async () => {
                  await fetch("/api/match/init", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
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
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

type MatchCardProps = {
  match: Match;
  onClick: () => void;
};

function MatchCard({ match, onClick }: MatchCardProps) {
  const isLive = match.status === "LIVE";

  return (
    <div onClick={onClick} className="bg-gray-900 p-4 rounded-xl cursor-pointer">
      <h2>
        {match.teamA} vs {match.teamB}
      </h2>

      {isLive && (
        <>
          <p>{match.score ?? "0/0"} ({match.overDisplay ?? "0.0"})</p>
          <p className="text-xs text-gray-400 mt-1">
            Connection: {match.reconnectHealth ?? "unknown"}
            {match.heartbeatFresh ? " • fresh" : " • waiting"}
          </p>
        </>
      )}

      {match.commentaryPreview ? (
        <p className="text-xs text-gray-400 mt-2 italic truncate">
          {match.commentaryPreview}
        </p>
      ) : null}

      <button className="mt-3 bg-purple-600 px-3 py-1 rounded">Open Match</button>
    </div>
  );
}
