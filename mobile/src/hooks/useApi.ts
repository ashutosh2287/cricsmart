import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://cricsmart.vercel.app/api";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(endpoint: string, deps: unknown[] = []): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...deps]);

  return { data, loading, error, refetch: fetchData };
}

export function useLiveMatches() {
  return useApi<{ data: FixtureMatch[] }>("/live/fixtures");
}

export function useSimulations() {
  return useApi<SimMatch[]>("/matches");
}

export function useTeams() {
  return useApi<Team[]>("/teams");
}

export function usePlayers() {
  return useApi<Player[]>("/player-profiles");
}

export function useSearch(query: string) {
  return useApi<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`, [query]);
}

// Types
export type FixtureMatch = {
  id: string;
  name: string;
  status: string;
  isLive: boolean;
  score?: { r?: number; w?: number; o?: number }[];
  teams?: string[];
  teamInfo?: { name: string }[];
  matchCategory?: string;
  venue?: string;
};

export type SimMatch = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: string;
  score?: string;
  overDisplay?: string;
};

export type Team = {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  city: string | null;
  visibility: string;
  _count?: { members: number };
};

export type Player = {
  id: string;
  displayName: string;
  role: string | null;
};

export type SearchResult = {
  type: "player" | "team" | "match";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};
