import { buildMatchSections } from "./buildMatchSections";
import { formatMatchForDisplay } from "./displayFormatter";
import { classifyProviderMatch } from "./matchClassifier";
import { scoreMatchPriority } from "./matchPriority";
import { CuratedMatch, MatchSections, ProviderMatch } from "./types";

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function curateProviderMatches(payload: unknown, source: string): CuratedMatch[] {
  const root = (typeof payload === "object" && payload !== null ? payload : {}) as {
    data?: unknown;
  };

  const providerMatches = asArray(root.data);

  return providerMatches
    .map((raw) => {
      const match = (typeof raw === "object" && raw !== null ? raw : {}) as ProviderMatch;
      const classified = classifyProviderMatch(match, source);
      const formatted = formatMatchForDisplay(classified);
      const priorityScore = scoreMatchPriority(formatted);
      return { ...formatted, priorityScore };
    })
    .filter((match) => Boolean(match.id) && Boolean(match.title));
}

export function curateDiscovery(payload: unknown, source: string): { data: CuratedMatch[]; sections: MatchSections } {
  const data = curateProviderMatches(payload, source);
  const sections = buildMatchSections(data);
  return { data, sections };
}
