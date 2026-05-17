export const SIMULATION_LIFECYCLE_STATES = [
  "DRAFT",
  "CONFIGURING",
  "READY",
  "INITIALIZING",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
] as const;

export type SimulationLifecycleState = (typeof SIMULATION_LIFECYCLE_STATES)[number];

const SIMULATION_LIFECYCLE_ORDER: Record<SimulationLifecycleState, number> = {
  DRAFT: 0,
  CONFIGURING: 1,
  READY: 2,
  INITIALIZING: 3,
  RUNNING: 4,
  PAUSED: 5,
  COMPLETED: 6,
};

export function normalizeSimulationLifecycleState(
  value?: string | null
): SimulationLifecycleState {
  if (!value) return "DRAFT";
  return (
    SIMULATION_LIFECYCLE_STATES.find((state) => state === value) ?? "DRAFT"
  );
}

export function isSimulationLifecycleAtLeast(
  value: string | null | undefined,
  minimum: SimulationLifecycleState
): boolean {
  const normalized = normalizeSimulationLifecycleState(value);
  return (
    SIMULATION_LIFECYCLE_ORDER[normalized] >= SIMULATION_LIFECYCLE_ORDER[minimum]
  );
}
