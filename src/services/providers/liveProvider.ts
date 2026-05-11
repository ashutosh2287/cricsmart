import type { ApiBallEvent } from "@/services/api/cricketApiService";

export type LiveProvider = {
  name: string;
  fetchEvents: (externalMatchId: string, signal?: AbortSignal) => Promise<ApiBallEvent[]>;
};
