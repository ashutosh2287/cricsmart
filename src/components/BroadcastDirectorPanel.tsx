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
    <div
      className="space-y-3"
      style={{
        background: "var(--surface)",
        border: "0.5px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem",
      }}
    >

      <h2
        style={{
          color: "var(--text-1)",
          fontFamily: "var(--font-display)",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        Broadcast Director Panel
      </h2>

      <div className="grid grid-cols-2 gap-2">

        <button
          className="bg-[var(--danger)] p-2 rounded"
          onClick={cameraShake}
          style={{ color: "#ffffff" }}
        >
          🎬 Camera Shake
        </button>

        <button
          className="bg-[var(--accent-brand)] p-2 rounded"
          onClick={slowMotion}
          style={{ color: "#ffffff" }}
        >
          🎥 Slow Motion
        </button>

        <button
          className="bg-[var(--accent-amber)] p-2 rounded"
          onClick={tensionMode}
          style={{ color: "#ffffff" }}
        >
          🔥 Enter Tension
        </button>

        <button
          className="bg-[var(--brand-dark)] p-2 rounded"
          onClick={showOverlay}
          style={{ color: "#ffffff" }}
        >
          📺 Show Overlay
        </button>

      </div>

    </div>
  );
}
