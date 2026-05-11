"use client";

import { useEffect, useState } from "react";
import { getMatchMeta } from "@/store/matchStore";
import { startReplay } from "@/services/replay/replayEngine";
import { loadHistoricalMatch } from "@/services/replay/loadHistoricalMatch";
import { connectRealtime } from "@/services/realtime/connectRealtime";

type Props = {
  matchId: string;
};

export default function MatchControlPanel({ matchId }: Props) {
  const [isStarting, setIsStarting] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 HANDLE SSE CONNECT EVENT (FINAL FIX)
  useEffect(() => {
  function handleConnected(e: Event) {
    console.log("🧠 SSE_CONNECTED EVENT CAUGHT");

    const customEvent = e as CustomEvent<{ matchId: string }>;

    if (!customEvent?.detail?.matchId) return;
    if (customEvent.detail.matchId !== matchId) return;

    const matchMeta = getMatchMeta(matchId);
    if (!matchMeta) return;
    if (!matchMeta.toss?.winner || !matchMeta.toss?.decision) {
      setError("Please complete toss first.");
      setIsStarting(false);
      return;
    }

    console.log("🔥 SSE CONNECTED → Starting simulation");
    console.log("🧠 MATCH META:", matchMeta);

    fetch("/api/start-simulation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matchId,
        teamAName: matchMeta.teamA.name,
        teamBName: matchMeta.teamB.name,
        tossWinner: matchMeta.toss.winner,
        tossDecision: matchMeta.toss.decision,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("[MatchControlPanel] Simulation started", data);
      })
      .catch((err) => {
        console.error("❌ Simulation start failed:", err);
        setError("Failed to start simulation");
      })
      .finally(() => {
        setIsStarting(false);
      });
  }

  // ✅ THIS WAS MISSING
  window.addEventListener("SSE_CONNECTED", handleConnected);

  return () => {
    window.removeEventListener("SSE_CONNECTED", handleConnected);
  };
}, [matchId]);

  // 🔥 START BUTTON (NO TIMEOUT, NO API CALL)
  async function startMatch() {
    if (!matchId) {
      setError("Missing matchId");
      return;
    }

    if (isStarting) return;

    const matchMeta = getMatchMeta(matchId);

    if (!matchMeta) {
      setError("Match meta not found. Please reselect teams before starting.");
      console.error("[MatchControlPanel] Missing matchMeta for match:", matchId);
      return;
    }

    try {
      setIsStarting(true);
      setError(null);

      console.log("[MatchControlPanel] Start Match clicked", {
        matchId,
        matchMeta,
      });

      // ✅ ONLY THIS — NO FETCH HERE
      connectRealtime(matchId, "match-control-panel");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start simulation";
      console.error("[MatchControlPanel] Simulation start failed:", err);
      setError(message);
      setIsStarting(false);
    }
  }

  async function startHistoricalReplay() {
    if (!matchId || isReplaying) return;

    try {
      setIsReplaying(true);
      setError(null);

      const events = await loadHistoricalMatch(matchId);

      if (!events.length) {
        console.warn("No historical events found for replay");
        setError("No historical events found for replay.");
        return;
      }

      startReplay(matchId, events);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start replay";
      console.error("[MatchControlPanel] Replay failed:", err);
      setError(message);
    } finally {
      setIsReplaying(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startMatch}
          disabled={isStarting}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-md text-sm"
        >
          {isStarting ? "Starting..." : "▶ Start Match"}
        </button>

        <button
          type="button"
          onClick={startHistoricalReplay}
          disabled={isReplaying}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-md text-sm"
        >
          {isReplaying ? "Loading Replay..." : "▶ Replay Match"}
        </button>
      </div>

      {error ? (
        <div className="text-sm text-red-400">
          {error}
        </div>
      ) : null}
    </div>
  );
}
