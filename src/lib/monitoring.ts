/**
 * Production monitoring and crash-handling utility.
 *
 * - Captures unhandled errors and promise rejections on the client.
 * - Provides `reportError` for manual error reporting.
 * - In production, errors can be forwarded to an external service by
 *   setting the NEXT_PUBLIC_ERROR_ENDPOINT environment variable.
 */

"use client";

type ErrorReport = {
  message: string;
  stack?: string;
  context?: string;
  data?: unknown;
  timestamp: string;
  userAgent?: string;
  url?: string;
};

const endpoint =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_ERROR_ENDPOINT
    : undefined;

function buildReport(
  error: unknown,
  context?: string,
  data?: unknown
): ErrorReport {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    message: err.message,
    stack: err.stack,
    context,
    data,
    timestamp: new Date().toISOString(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  };
}

async function sendReport(report: ErrorReport) {
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      keepalive: true,
    });
  } catch {
    // Swallow — reporting must never throw
  }
}

export function reportError(
  error: unknown,
  context?: string,
  data?: unknown
) {
  const report = buildReport(error, context, data);

  if (process.env.NODE_ENV !== "production") {
    console.error(`[MONITOR] [${context ?? "unknown"}]`, error, data ?? "");
    return;
  }

  console.error(`[MONITOR] [${context ?? "unknown"}]`, report.message);
  sendReport(report);
}

let _initialized = false;

export function initMonitoring() {
  if (typeof window === "undefined") return;
  if (_initialized) return;
  _initialized = true;

  window.addEventListener("error", (event) => {
    reportError(event.error ?? event.message, "UNHANDLED_ERROR");
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, "UNHANDLED_REJECTION");
  });
}
