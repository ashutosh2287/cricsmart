import { recoverRuntimeSessions } from "@/services/runtime/sessionRecovery";

type GlobalState = typeof globalThis & {
  __SESSION_RECOVERY_BOOTSTRAPPED__?: boolean;
};

const state = globalThis as GlobalState;

export function ensureSessionRecoveryStarted() {
  if (state.__SESSION_RECOVERY_BOOTSTRAPPED__) return;
  state.__SESSION_RECOVERY_BOOTSTRAPPED__ = true;
  recoverRuntimeSessions().catch(() => {
    state.__SESSION_RECOVERY_BOOTSTRAPPED__ = false;
  });
}
