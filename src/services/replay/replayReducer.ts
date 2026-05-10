/**
 * Pure replay reducer — manages all replay state transitions.
 *
 * All state updates go through `replayReducer`; side-effects (RAF,
 * timers) live in the replay engine, not here.
 */

export type ReplayStatus = "idle" | "playing" | "paused" | "ended";

export type ReplayState = {
  /** Current ball index within the event stream */
  index: number;
  /** Total number of ball events available */
  totalEvents: number;
  /** Current playback status */
  status: ReplayStatus;
  /** Playback speed multiplier (1 = 800 ms/ball) */
  speed: number;
  /** Playback direction: 1 = forward, -1 = reverse */
  direction: 1 | -1;
  /** Whether replay mode is active (hides live UI) */
  isReplayMode: boolean;
  /** Indices of wicket events for quick navigation */
  wicketIndices: number[];
  /** Indices of six-run events for quick navigation */
  sixIndices: number[];
};

export type ReplayAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STOP" }
  | { type: "SEEK"; index: number }
  | { type: "ADVANCE" }
  | { type: "SET_SPEED"; speed: number }
  | { type: "SET_DIRECTION"; direction: 1 | -1 }
  | { type: "LOAD_EVENTS"; totalEvents: number; wicketIndices: number[]; sixIndices: number[] }
  | { type: "EXIT_REPLAY" };

export function initialReplayState(): ReplayState {
  return {
    index: 0,
    totalEvents: 0,
    status: "idle",
    speed: 1,
    direction: 1,
    isReplayMode: false,
    wicketIndices: [],
    sixIndices: [],
  };
}

export function replayReducer(
  state: ReplayState,
  action: ReplayAction
): ReplayState {
  switch (action.type) {
    case "LOAD_EVENTS":
      return {
        ...state,
        totalEvents: action.totalEvents,
        wicketIndices: action.wicketIndices,
        sixIndices: action.sixIndices,
        index: state.direction === 1 ? 0 : Math.max(0, action.totalEvents - 1),
        isReplayMode: true,
        status: "idle",
      };

    case "PLAY":
      if (state.totalEvents === 0) return state;
      if (state.status === "ended") {
        // Restart from beginning (or end for reverse)
        return {
          ...state,
          index: state.direction === 1 ? 0 : state.totalEvents - 1,
          status: "playing",
        };
      }
      return { ...state, status: "playing" };

    case "PAUSE":
      if (state.status !== "playing") return state;
      return { ...state, status: "paused" };

    case "STOP":
      return {
        ...state,
        status: "idle",
        index: state.direction === 1 ? 0 : Math.max(0, state.totalEvents - 1),
        isReplayMode: false,
      };

    case "SEEK": {
      const clampedIndex = Math.max(
        0,
        Math.min(action.index, state.totalEvents - 1)
      );
      return {
        ...state,
        index: clampedIndex,
        status: "paused",
        isReplayMode: true,
      };
    }

    case "ADVANCE": {
      if (state.status !== "playing") return state;
      const next = state.index + state.direction;
      if (next < 0 || next >= state.totalEvents) {
        return { ...state, status: "ended" };
      }
      return { ...state, index: next };
    }

    case "SET_SPEED":
      return { ...state, speed: Math.max(0.1, Math.min(action.speed, 8)) };

    case "SET_DIRECTION":
      return { ...state, direction: action.direction };

    case "EXIT_REPLAY":
      return {
        ...initialReplayState(),
        wicketIndices: state.wicketIndices,
        sixIndices: state.sixIndices,
      };

    default:
      return state;
  }
}

/*
============================================================
NAVIGATION HELPERS
============================================================
*/

/** Returns the index of the next wicket after the current position, or -1 */
export function nextWicketIndex(state: ReplayState): number {
  const { wicketIndices, index } = state;
  return wicketIndices.find((i) => i > index) ?? -1;
}

/** Returns the index of the previous wicket before the current position, or -1 */
export function prevWicketIndex(state: ReplayState): number {
  const { wicketIndices, index } = state;
  return [...wicketIndices].reverse().find((i) => i < index) ?? -1;
}

/** Returns the index of the next six after the current position, or -1 */
export function nextSixIndex(state: ReplayState): number {
  const { sixIndices, index } = state;
  return sixIndices.find((i) => i > index) ?? -1;
}

/** Returns the index of the previous six before the current position, or -1 */
export function prevSixIndex(state: ReplayState): number {
  const { sixIndices, index } = state;
  return [...sixIndices].reverse().find((i) => i < index) ?? -1;
}
