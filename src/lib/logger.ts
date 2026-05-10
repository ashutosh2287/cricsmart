/**
 * Structured production logger.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("MATCH LIFECYCLE", "simulation started", { matchId });
 *   logger.error("SSE ERROR", "connection failed", error);
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  tag: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  if (env && env in LEVELS) return env;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.tag}] ${entry.message}`;
  if (entry.data !== undefined) {
    try {
      return `${base} ${JSON.stringify(entry.data)}`;
    } catch {
      return `${base} [unserializable]`;
    }
  }
  return base;
}

function emit(level: LogLevel, tag: string, message: string, data?: unknown) {
  const minLevel = getMinLevel();
  if (LEVELS[level] < LEVELS[minLevel]) return;

  const entry: LogEntry = {
    level,
    tag,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case "debug":
      // eslint-disable-next-line no-console
      console.debug(formatted);
      break;
    case "info":
      // eslint-disable-next-line no-console
      console.log(formatted);
      break;
    case "warn":
      // eslint-disable-next-line no-console
      console.warn(formatted);
      break;
    case "error":
      // eslint-disable-next-line no-console
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (tag: string, message: string, data?: unknown) =>
    emit("debug", tag, message, data),
  info: (tag: string, message: string, data?: unknown) =>
    emit("info", tag, message, data),
  warn: (tag: string, message: string, data?: unknown) =>
    emit("warn", tag, message, data),
  error: (tag: string, message: string, data?: unknown) =>
    emit("error", tag, message, data),
};
