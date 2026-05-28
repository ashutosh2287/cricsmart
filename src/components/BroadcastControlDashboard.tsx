"use client";

import { emitBroadcastCommand } from "@/services/broadcastCommands";

export default function BroadcastControlDashboard() {

  function triggerReplay() {
    emitBroadcastCommand({
      type: "PLAY_SLOW_MOTION",
      slug: "manual_replay"
    });
  }

  function triggerCameraSweep() {
    emitBroadcastCommand({
      type: "CAMERA_SWEEP",
      slug: "manual_camera"
    });
  }

  function triggerTension() {
    emitBroadcastCommand({
      type: "ENTER_TENSION"
    });
  }

  function showOverlay(text: string) {
    emitBroadcastCommand({
      type: "SHOW_OVERLAY",
      overlay: text
    });
  }

  return (
    <div className="p-4 bg-[var(--surface)] text-[var(--text-1)] border border-[var(--border)] rounded-lg space-y-4">

      <h2 className="text-xl font-bold">
        Broadcast Control Dashboard
      </h2>

      <div className="flex gap-3 flex-wrap">

        <button
          onClick={triggerReplay}
          className="px-4 py-2 bg-red-600 rounded"
          style={{ color: "#ffffff" }}
        >
          Trigger Replay
        </button>

        <button
          onClick={triggerCameraSweep}
          className="px-4 py-2 bg-blue-600 rounded"
          style={{ color: "#ffffff" }}
        >
          Camera Sweep
        </button>

        <button
          onClick={triggerTension}
          className="px-4 py-2 bg-yellow-600 rounded"
          style={{ color: "#ffffff" }}
        >
          Enter Tension
        </button>

        <button
          onClick={() => showOverlay("Strategic Timeout")}
          className="px-4 py-2 bg-green-600 rounded"
          style={{ color: "#ffffff" }}
        >
          Strategic Timeout
        </button>

      </div>

    </div>
  );
}