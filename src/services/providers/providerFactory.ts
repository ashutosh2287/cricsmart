import type { ProviderMode } from "@/config/providerMode";
import { getProviderMode } from "@/config/providerMode";
import type { MatchProvider } from "@/services/providers/types";
import { cricApiMatchProvider } from "@/services/providers/cricapiLiveProvider";
import { mockMatchProvider } from "@/services/providers/mock/MockMatchProvider";
import { simulationMatchProvider } from "@/services/providers/simulationMatchProvider";

export function getMatchProvider(mode: ProviderMode = getProviderMode()): MatchProvider {
  if (mode === "mock") return mockMatchProvider;
  if (mode === "simulation") return simulationMatchProvider;
  return cricApiMatchProvider;
}
