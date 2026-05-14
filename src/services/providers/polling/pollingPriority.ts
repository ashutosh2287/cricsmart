export type PriorityBand = "highest" | "medium" | "low";

type PriorityInput = {
  teamA?: string;
  teamB?: string;
  seriesName?: string;
  format?: string;
};

function hasIndiaTeam(input: PriorityInput): boolean {
  const teams = `${input.teamA ?? ""} ${input.teamB ?? ""}`.toLowerCase();
  return teams.includes("india");
}

function isIplPlayoff(input: PriorityInput): boolean {
  const series = (input.seriesName ?? "").toLowerCase();
  return (
    series.includes("ipl") &&
    (series.includes("playoff") ||
      series.includes("final") ||
      series.includes("qualifier") ||
      series.includes("eliminator"))
  );
}

function isIccTournament(input: PriorityInput): boolean {
  const series = (input.seriesName ?? "").toLowerCase();
  return series.includes("icc") || series.includes("world cup") || series.includes("champions");
}

function isInternational(input: PriorityInput): boolean {
  const series = (input.seriesName ?? "").toLowerCase();
  return (
    series.includes("vs") ||
    series.includes("international") ||
    series.includes("bilateral") ||
    Boolean(input.format && ["T20", "ODI", "TEST"].includes(input.format.toUpperCase()))
  );
}

function isPopularLeague(input: PriorityInput): boolean {
  const series = (input.seriesName ?? "").toLowerCase();
  return (
    series.includes("ipl") ||
    series.includes("bbl") ||
    series.includes("psl") ||
    series.includes("the hundred") ||
    series.includes("cpl")
  );
}

export function getMatchPriorityScore(input: PriorityInput): number {
  let score = 20;
  if (isIplPlayoff(input)) score += 55;
  if (isIccTournament(input)) score += 45;
  if (hasIndiaTeam(input)) score += 35;
  if (isInternational(input)) score += 20;
  if (isPopularLeague(input)) score += 15;
  return Math.min(100, score);
}

export function toPriorityBand(score: number): PriorityBand {
  if (score >= 75) return "highest";
  if (score >= 45) return "medium";
  return "low";
}
