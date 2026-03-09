import { subscribeTacticalSignal } from "./tacticalSignalBus";
import { emitOverlay } from "./overlayBus";

/*
================================================
TACTICAL → OVERLAY BRIDGE

Converts tactical signals into broadcast overlays.
Pure mapping layer — no logic here.
================================================
*/

export function initTacticalOverlayBridge() {

  subscribeTacticalSignal((signal) => {

    const overlayMap = {
      COLLAPSE_ALERT: "TACTICAL_COLLAPSE",
      ASSAULT_PHASE: "TACTICAL_ASSAULT",
      STRANGLE_ALERT: "TACTICAL_STRANGLE",
      PANIC_MODE: "TACTICAL_PANIC",
      RECOVERY_PHASE: "TACTICAL_RECOVERY"
    } as const;

    const overlayType = overlayMap[signal.type];

    if (!overlayType) return;

    emitOverlay({
      type: overlayType,
      intensity: signal.intensity
    });

  });

}