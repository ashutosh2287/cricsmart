import { logger } from "@/lib/logger";
import { getSimulationSeed } from "@/services/simulation/simulationRandom";
import type { BallEvent } from "@/types/ballEvent";
import type { SessionSourceType } from "@/types/liveSession";
import {
  appendRecordingEvent,
  patchRecordingMetadata,
} from "@/services/recording/recordingStore";
import { WIN_PROBABILITY_FEATURE_SCHEMA_VERSION } from "@/services/ml/schema/featureContracts";

type SessionFallback = {
  sourceType: SessionSourceType;
  provider?: string;
};

function resolveSourceFromEvent(event: BallEvent): SessionSourceType {
  if (event.eventSource === "REPLAY") return "REPLAY";
  if (event.eventSource === "MOCK_INGESTION") return "MOCK";
  if (event.eventSource === "LIVE_INGESTION") return "LIVE";
  return "SIMULATION";
}

export async function recordBallEvent(matchId: string, event: BallEvent) {
  const metadata: SessionFallback = {
    sourceType: resolveSourceFromEvent(event),
    provider: event.providerType,
  };

  try {
    const seed = getSimulationSeed(matchId);

    patchRecordingMetadata(matchId, {
      sourceType: metadata.sourceType,
      provider: metadata.provider,
      seed,
      featureSchemaVersion: WIN_PROBABILITY_FEATURE_SCHEMA_VERSION,
    });
    appendRecordingEvent(matchId, event);
  } catch (error) {
    logger.warn("RECORDING", "recording_write_failed", {
      matchId,
      error: error instanceof Error ? error.message : String(error),
    });
    patchRecordingMetadata(matchId, metadata);
    appendRecordingEvent(matchId, event);
  }
}
