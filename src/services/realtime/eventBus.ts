import type { SimulationEvent } from "@/services/simulation/matchSimulator";

type Listener = (event: SimulationEvent) => void;

// 🔥 FORCE GLOBAL SHARED INSTANCE
const globalAny = globalThis as unknown as {
  __eventBusListeners?: Set<Listener>;
};

if (!globalAny.__eventBusListeners) {
  globalAny.__eventBusListeners = new Set<Listener>();
}

const listeners = globalAny.__eventBusListeners;

export function emitEvent(event: SimulationEvent) {
  listeners.forEach((listener) => listener(event));
}

export function subscribeSimulation(listener: Listener) {
  listeners.add(listener);
}

export function unsubscribeSimulation(listener: Listener) {
  listeners.delete(listener);
}