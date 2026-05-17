import { initMatch, getMatchState } from "@/services/matchEngine";
import { createMatchId } from "@/services/match/createLiveMatchId";
import {
  getMatchRegistry,
  patchMatchRegistry,
  upsertMatchRegistry,
  type MatchRegistryStatus,
} from "@/services/match/matchRegistry";
import { logger } from "@/lib/logger";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import type { SimulationLifecycleState } from "@/services/simulation/simulation-lifecycle";
import { normalizeSimulationLifecycleState } from "@/services/simulation/simulation-lifecycle";

function statusForLifecycle(state: SimulationLifecycleState): MatchRegistryStatus {
  if (state === "RUNNING" || state === "PAUSED") return "LIVE";
  if (state === "COMPLETED") return "COMPLETED";
  return "UPCOMING";
}

export async function createDraftSimulationSession(input: {
  teamA: string;
  teamB: string;
}) {
  const teamA = input.teamA.trim();
  const teamB = input.teamB.trim();
  const matchId = createMatchId(teamA, teamB);

  initMatch(matchId);
  const state = getMatchState(matchId);
  if (!state) {
    throw new Error("Failed to initialize match state");
  }

  const storage = new RedisSimulationStorage();
  await storage.save(matchId, state, {
    isRunning: false,
    isPaused: false,
    speed: 1500,
  });

  const now = Date.now();
  await upsertMatchRegistry({
    matchId,
    slug: matchId,
    teamA,
    teamB,
    status: "UPCOMING",
    type: "SIMULATION",
    sourceType: "SIMULATION",
    simulationLifecycle: "DRAFT",
    isLiveConnected: false,
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
    createdAt: now,
    lastHeartbeatAt: now,
  });

  logger.info("SIMULATION", "simulationCreated", { matchId, teamA, teamB });
  logger.info("SIMULATION", "matchStateInitialized", { matchId });

  return { matchId, slug: matchId };
}

export async function transitionSimulationLifecycle(
  matchId: string,
  lifecycle: SimulationLifecycleState
) {
  const registry = await getMatchRegistry(matchId);
  if (!registry || registry.type !== "SIMULATION") {
    return null;
  }

  const next = await patchMatchRegistry(matchId, {
    simulationLifecycle: lifecycle,
    status: statusForLifecycle(lifecycle),
  });

  if (lifecycle === "CONFIGURING" || lifecycle === "READY") {
    logger.info("SIMULATION", "simulationConfigured", { matchId, lifecycle });
  }
  if (lifecycle === "INITIALIZING" || lifecycle === "RUNNING") {
    logger.info("SIMULATION", "matchEngineReady", { matchId, lifecycle });
  }

  return next;
}

export async function getSimulationLifecycle(matchId: string) {
  const registry = await getMatchRegistry(matchId);
  if (!registry || registry.type !== "SIMULATION") return null;
  return normalizeSimulationLifecycleState(registry.simulationLifecycle);
}
