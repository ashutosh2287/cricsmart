"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users, Trophy, Calendar } from "lucide-react";

interface SearchResult {
  type: "player" | "team" | "match";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

interface GlobalSearchProps {
  onClose?: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    let cancelled = false;

    const search = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!cancelled) {
          setResults(Array.isArray(data) ? data.slice(0, 8) : []);
          setSelectedIndex(0);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = setTimeout(search, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose?.();
    }
  };

  const typeIcons = {
    player: Users,
    team: Trophy,
    match: Calendar,
  };

  const typeLabels = {
    player: "Player",
    team: "Team",
    match: "Match",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-[var(--overlay-strong)] backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-3)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search players, teams, matches..."
            className="flex-1 bg-transparent text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[var(--text-3)] hover:text-[var(--text-1)]">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex text-[10px] text-[var(--text-3)] bg-[var(--surface-3)] px-1.5 py-0.5 rounded border border-[var(--border)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-xs text-[var(--text-3)]">Searching...</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-4 text-center text-xs text-[var(--text-3)]">No results found</div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-1">
              {results.map((result, i) => {
                const Icon = typeIcons[result.type];
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === selectedIndex ? "bg-[var(--surface-3)]" : "hover:bg-[var(--surface-3)]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-3)] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[var(--text-3)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-1)] truncate">{result.title}</p>
                      <p className="text-xs text-[var(--text-3)] truncate">{result.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider shrink-0">
                      {typeLabels[result.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!query && (
            <div className="p-6 text-center">
              <p className="text-xs text-[var(--text-3)]">Type to search across players, teams, and matches</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
