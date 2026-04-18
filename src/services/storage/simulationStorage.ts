import { SimulationState } from "@/services/simulation/simulationState";

type StoredSimulation = {
  matchId: string;
  state: SimulationState;
  control: {
    isRunning: boolean;
    isPaused: boolean;
    speed: number;
  };
  updatedAt: number;
};

const simulationDB = new Map<string, StoredSimulation>();

export function saveSimulation(
  matchId: string,
  state: SimulationState,
  control: {
    isRunning: boolean;
    isPaused: boolean;
    speed: number;
  }
) {
  simulationDB.set(matchId, {
    matchId,
    state: { ...state }, // 🔥 important (clone)
    control,
    updatedAt: Date.now(),
  });
}

export function loadSimulation(matchId: string) {
  return simulationDB.get(matchId) ?? null;
}

export function deleteSimulation(matchId: string) {
  simulationDB.delete(matchId);
}