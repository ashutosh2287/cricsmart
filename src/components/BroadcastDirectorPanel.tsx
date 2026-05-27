"use client";

import { emitBroadcastCommand } from "@/services/broadcastCommands";

export default function BroadcastDirectorPanel() {

  function cameraShake() {
    emitBroadcastCommand({
      type: "CAMERA_SHAKE",
      intensity: 1
    });
  }

  function slowMotion() {
    emitBroadcastCommand({
      type: "PLAY_SLOW_MOTION",
      slug: "manual"
    });
  }

  function tensionMode() {
    emitBroadcastCommand({
      type: "ENTER_TENSION"
    });
  }

  function showOverlay() {
    emitBroadcastCommand({
      type: "SHOW_OVERLAY",
      overlay: "DIRECTOR_MESSAGE"
    });
  }

  return (
    <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] p-4 rounded-xl space-y-3 border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">

      <h2 className="font-display font-semibold text-lg">
        Broadcast Director Panel
      </h2>

      <div className="grid grid-cols-2 gap-2">

        <button
          className="bg-[var(--danger)] text-white p-2 rounded"
          onClick={cameraShake}
        >
          🎬 Camera Shake
        </button>

        <button
          className="bg-[var(--accent-brand)] text-white p-2 rounded"
          onClick={slowMotion}
        >
          🎥 Slow Motion
        </button>

        <button
          className="bg-[var(--accent-amber)] text-white p-2 rounded"
          onClick={tensionMode}
        >
          🔥 Enter Tension
        </button>

        <button
          className="bg-[var(--brand-dark)] text-white p-2 rounded"
          onClick={showOverlay}
        >
          📺 Show Overlay
        </button>

      </div>

    </div>
  );
}
