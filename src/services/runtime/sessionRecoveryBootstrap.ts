import { recoverRuntimeSessions } from "@/services/runtime/sessionRecovery";
import { logger } from "@/lib/logger";

type GlobalState = typeof globalThis & {
  __SESSION_RECOVERY_BOOTSTRAPPED__?: boolean;
};

const state = globalThis as GlobalState;

export function ensureSessionRecoveryStarted() {
  if (state.__SESSION_RECOVERY_BOOTSTRAPPED__) return;
  state.__SESSION_RECOVERY_BOOTSTRAPPED__ = true;
  recoverRuntimeSessions().catch((error) => {
    logger.error("RECOVERY", "bootstrap_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    state.__SESSION_RECOVERY_BOOTSTRAPPED__ = false;
  });
}
