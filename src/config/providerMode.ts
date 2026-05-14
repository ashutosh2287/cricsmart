export type ProviderMode = "mock" | "cricketdata" | "simulation";

function normalizeMode(value: string | undefined): ProviderMode {
  const mode = (value ?? "").trim().toLowerCase();
  if (mode === "mock") return "mock";
  if (mode === "simulation") return "simulation";
  if (mode === "cricketdata") return "cricketdata";

  if (process.env.NODE_ENV === "production") {
    return "cricketdata";
  }

  return "simulation";
}

export function getProviderMode(): ProviderMode {
  return normalizeMode(process.env.LIVE_PROVIDER_MODE);
}

export function isLiveProviderMode(mode: ProviderMode = getProviderMode()) {
  return mode === "cricketdata";
}

export function isMockProviderMode(mode: ProviderMode = getProviderMode()) {
  return mode === "mock";
}

export function isSimulationProviderMode(mode: ProviderMode = getProviderMode()) {
  return mode === "simulation";
}
