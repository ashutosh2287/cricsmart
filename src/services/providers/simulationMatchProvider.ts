import type {
  MatchProvider,
  ProviderMatchState,
} from "@/services/providers/types";
import type { ProviderMatch } from "@/services/matches/types";

export const simulationMatchProvider: MatchProvider = {
  name: "simulation",
  mode: "simulation",
  supportsLivePolling: false,
  getFixtures: async () => [] as ProviderMatch[],
  getMatchState: async (externalMatchId: string): Promise<ProviderMatchState> => ({
    externalMatchId,
    status: "live",
    updatedAt: Date.now(),
  }),
  pollMatchEvents: async () => [],
};
