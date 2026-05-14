import { getMatchRegistry } from "@/services/match/matchRegistry";
import {
  getRecordingSession,
  type RecordingFormat,
} from "@/services/recording/recordingStore";
import { getReplayExport } from "@/services/simulation/simulationReplayExport";
import { getSimulationSeed } from "@/services/simulation/simulationRandom";
import type { BallEvent } from "@/types/ballEvent";
import { validateDatasetIntegrity } from "@/services/ml/dataset/integrityChecks";

type ExportResult = {
  matchId: string;
  format: RecordingFormat;
  metadata: {
    version: string;
    featureSchemaVersion?: string;
    sourceType: string;
    provider?: string;
    seed?: string;
    exportedAt: string;
    eventCount: number;
    integrity: {
      ok: boolean;
      issues: string[];
    };
  };
  payload: unknown;
};

function toParquetReadyRows(matchId: string, events: BallEvent[]) {
  return events.map((event, index) => ({
    match_id: matchId,
    sequence: index + 1,
    event_id: event.id,
    innings: event.innings ?? 0,
    over: event.over,
    type: event.type,
    runs: event.runs,
    batsman: event.batsman,
    non_striker: event.nonStriker,
    bowler: event.bowler,
    provider_type: event.providerType ?? null,
    provider_timestamp: event.providerTimestamp ?? null,
    ingestion_timestamp: event.ingestionTimestamp ?? null,
    event_source: event.eventSource ?? null,
    replay_source_id: event.replaySourceId ?? null,
  }));
}

export async function exportRecordingDataset(
  matchId: string,
  format: RecordingFormat = "json"
): Promise<ExportResult> {
  const registry = await getMatchRegistry(matchId);
  const recording = getRecordingSession(matchId);
  const replay = getReplayExport(matchId);
  const seed = getSimulationSeed(matchId);
  const events = recording?.events.map((entry) => entry.event) ?? replay.events;
  const integrity = validateDatasetIntegrity(events);

  const metadata = {
    version: recording?.metadata.version ?? "v1",
    featureSchemaVersion: recording?.metadata.featureSchemaVersion,
    sourceType:
      recording?.metadata.sourceType ??
      registry?.sourceType ??
      (registry?.type === "LIVE" ? "LIVE" : "SIMULATION"),
    provider: recording?.metadata.provider ?? registry?.provider,
    seed: recording?.metadata.seed ?? seed,
    exportedAt: new Date().toISOString(),
    eventCount: events.length,
    integrity: {
      ok: integrity.ok,
      issues: integrity.issues,
    },
  };

  if (format === "ndjson") {
    return {
      matchId,
      format,
      metadata,
      payload: events.map((event) => JSON.stringify(event)).join("\n"),
    };
  }

  if (format === "parquet-ready") {
    return {
      matchId,
      format,
      metadata,
      payload: toParquetReadyRows(matchId, events),
    };
  }

  return {
    matchId,
    format: "json",
    metadata,
    payload: events,
  };
}
