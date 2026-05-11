"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getRealtimeConnectionState,
} from "@/services/realtime/connectRealtime";

type ConnectionPhase = "connected" | "connecting" | "disconnected" | "reconnecting";

type Props = {
  /** Show the indicator only when not connected */
  hideWhenConnected?: boolean;
};

function derivePhase(
  isConnected: boolean,
  readyState: number | null,
  reconnectAttempts: number
): ConnectionPhase {
  if (readyState === EventSource.OPEN) return "connected";
  if (readyState === EventSource.CONNECTING) {
    return reconnectAttempts > 0 ? "reconnecting" : "connecting";
  }
  return "disconnected";
}

export default function ConnectionStatus({ hideWhenConnected = true }: Props) {
  const initialState = getRealtimeConnectionState();
  const initialAttempts = initialState.reconnectAttempts;
  const [phase, setPhase] = useState<ConnectionPhase>(
    derivePhase(initialState.isConnected, initialState.readyState, initialAttempts)
  );
  const [attempts, setAttempts] = useState(initialAttempts);

  const refresh = useCallback(() => {
    const state = getRealtimeConnectionState();
    const reconnectAttempts = state.reconnectAttempts;
    setAttempts(reconnectAttempts);
    setPhase(
      derivePhase(state.isConnected, state.readyState, reconnectAttempts)
    );
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  if (hideWhenConnected && phase === "connected") return null;

  const config: Record<
    ConnectionPhase,
    { label: string; dot: string; bar: string }
  > = {
    connected: {
      label: "Live",
      dot: "bg-emerald-400",
      bar: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300",
    },
    connecting: {
      label: "Connecting…",
      dot: "bg-yellow-400 animate-pulse",
      bar: "bg-yellow-900/30 border-yellow-700/40 text-yellow-300",
    },
    reconnecting: {
      label: `Reconnecting… (attempt ${attempts})`,
      dot: "bg-orange-400 animate-pulse",
      bar: "bg-orange-900/30 border-orange-700/40 text-orange-300",
    },
    disconnected: {
      label: "Disconnected",
      dot: "bg-red-500",
      bar: "bg-red-900/30 border-red-700/40 text-red-300",
    },
  };

  const { label, dot, bar } = config[phase];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${bar}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </div>
  );
}
