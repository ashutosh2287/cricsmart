import { CuratedMatch } from "./types";

const STATUS_WEIGHT: Record<CuratedMatch["status"], number> = {
  live: 35,
  upcoming: 20,
  completed: 5,
};

function metadataQualityScore(match: CuratedMatch): number {
  let score = 0;
  if (match.teams[0]?.name && match.teams[1]?.name) score += 6;
  if (match.seriesName && match.seriesName !== "Cricket Series") score += 6;
  if (match.venue) score += 2;
  if (match.score.length > 0) score += 3;
  if (match.startTime && !Number.isNaN(new Date(match.startTime).getTime())) score += 4;
  return score;
}

function temporalScore(match: CuratedMatch): number {
  const time = new Date(match.startTime).getTime();
  if (!Number.isFinite(time) || time <= 0) return 0;
  const distanceHours = Math.abs(time - Date.now()) / (1000 * 60 * 60);
  if (match.status === "live") return 15;
  if (distanceHours <= 2) return 14;
  if (distanceHours <= 6) return 10;
  if (distanceHours <= 24) return 7;
  return Math.max(1, 6 - Math.floor(distanceHours / 24));
}

export function scoreMatchPriority(match: CuratedMatch): number {
  let score = 0;

  if (match.isIPL) score += 100;
  else if (match.isICC) score += 90;
  else if (match.isIndiaMatch) score += 80;
  else if (match.isInternational) score += 50;
  else if (match.format === "T20") score += 25;
  else score += 10;

  score += STATUS_WEIGHT[match.status];
  score += temporalScore(match);
  score += metadataQualityScore(match);
  score += Math.round((match.liveConfidenceScore ?? 0) / 10);

  return score;
}

export function compareCuratedMatches(a: CuratedMatch, b: CuratedMatch): number {
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;

  const statusRank: Record<CuratedMatch["status"], number> = {
    live: 3,
    upcoming: 2,
    completed: 1,
  };

  if (statusRank[b.status] !== statusRank[a.status]) {
    return statusRank[b.status] - statusRank[a.status];
  }

  const aTime = new Date(a.startTime).getTime();
  const bTime = new Date(b.startTime).getTime();

  if (a.status === "upcoming") {
    const aDistance = Math.abs(aTime - Date.now());
    const bDistance = Math.abs(bTime - Date.now());
    if (aDistance !== bDistance) return aDistance - bDistance;
  }

  if (a.status === "completed" && b.status === "completed" && aTime !== bTime) {
    return bTime - aTime;
  }

  if ((b.liveConfidenceScore ?? 0) !== (a.liveConfidenceScore ?? 0)) {
    return (b.liveConfidenceScore ?? 0) - (a.liveConfidenceScore ?? 0);
  }

  return a.title.localeCompare(b.title);
}
