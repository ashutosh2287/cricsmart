import { subscribeTacticalSignal } from "./tacticalSignalBus";
import { emitOverlay } from "./overlayBus";

export function initTacticalOverlayBridge() {

  subscribeTacticalSignal(signal => {

    switch (signal.type) {

      case "COLLAPSE_ALERT":
        emitOverlay({ type: "TACTICAL_COLLAPSE", intensity: signal.intensity });
        break;

      case "ASSAULT_PHASE":
        emitOverlay({ type: "TACTICAL_ASSAULT", intensity: signal.intensity });
        break;

      case "STRANGLE_ALERT":
        emitOverlay({ type: "TACTICAL_STRANGLE", intensity: signal.intensity });
        break;

      case "PANIC_MODE":
        emitOverlay({ type: "TACTICAL_PANIC", intensity: signal.intensity });
        break;

      case "RECOVERY_PHASE":
        emitOverlay({ type: "TACTICAL_RECOVERY", intensity: signal.intensity });
        break;
    }

  });

}