export type SimulationPresetKey =
  | "last-over-thriller"
  | "batting-collapse"
  | "chase-domination"
  | "rain-shortened"
  | "high-scoring-ipl";

export type SimulationPreset = {
  key: SimulationPresetKey;
  teamAName: string;
  teamBName: string;
  tossWinner: string;
  tossDecision: "BAT" | "BOWL";
  startSpeedMs?: number;
};

export const simulationPresets: SimulationPreset[] = [
  {
    key: "last-over-thriller",
    teamAName: "India",
    teamBName: "Australia",
    tossWinner: "India",
    tossDecision: "BOWL",
    startSpeedMs: 900,
  },
  {
    key: "batting-collapse",
    teamAName: "England",
    teamBName: "Pakistan",
    tossWinner: "England",
    tossDecision: "BAT",
    startSpeedMs: 700,
  },
  {
    key: "chase-domination",
    teamAName: "South Africa",
    teamBName: "New Zealand",
    tossWinner: "South Africa",
    tossDecision: "BOWL",
    startSpeedMs: 1100,
  },
  {
    key: "rain-shortened",
    teamAName: "India",
    teamBName: "Pakistan",
    tossWinner: "Pakistan",
    tossDecision: "BAT",
    startSpeedMs: 650,
  },
  {
    key: "high-scoring-ipl",
    teamAName: "India",
    teamBName: "England",
    tossWinner: "India",
    tossDecision: "BAT",
    startSpeedMs: 500,
  },
];

export function getSimulationPreset(key?: string): SimulationPreset | null {
  if (!key) return null;
  const normalized = key.trim().toLowerCase();
  return (
    simulationPresets.find((preset) => preset.key === normalized) ?? null
  );
}
