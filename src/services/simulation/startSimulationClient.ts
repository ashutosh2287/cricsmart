"use client";

type MatchMetaLike = {
  teamA?: { name?: string };
  teamB?: { name?: string };
  toss?: {
    winner?: string;
    decision?: "BAT" | "BOWL";
  };
};

type StartSimulationPayload = {
  matchId: string;
  teamAName: string;
  teamBName: string;
  tossWinner: string;
  tossDecision: "BAT" | "BOWL";
};

export function buildStartSimulationPayload(
  matchId: string,
  matchMeta: MatchMetaLike | null | undefined
): StartSimulationPayload {
  const safeMatchId = matchId.trim();
  const teamAName = matchMeta?.teamA?.name?.trim();
  const teamBName = matchMeta?.teamB?.name?.trim();
  const tossWinner = matchMeta?.toss?.winner?.trim();
  const tossDecision = matchMeta?.toss?.decision;

  if (!safeMatchId) {
    throw new Error("Missing match id.");
  }
  if (!teamAName || !teamBName) {
    throw new Error("Please select teams first.");
  }
  if (!tossWinner || !tossDecision) {
    throw new Error("Please complete toss first.");
  }

  return {
    matchId: safeMatchId,
    teamAName,
    teamBName,
    tossWinner,
    tossDecision,
  };
}

export async function startSimulationFromMeta(
  matchId: string,
  matchMeta: MatchMetaLike | null | undefined
) {
  const payload = buildStartSimulationPayload(matchId, matchMeta);

  const res = await fetch("/api/start-simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as
    | { success?: boolean; error?: string; alreadyRunning?: boolean }
    | null;

  if (!res.ok || !data?.success) {
    throw new Error(
      data?.error?.trim() || "Failed to start simulation. Please try again."
    );
  }

  return data;
}
