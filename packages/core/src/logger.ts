import { Logger, LogLevel } from "./types.js";

/**
 * No-op logger that does nothing
 */
export class NoOpLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Console logger with configurable log level
 */
export class ConsoleLogger implements Logger {
  constructor(private readonly level: LogLevel = LogLevel.WARN) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(
        "[DevBolt Debug]",
        message,
        meta ? JSON.stringify(meta, null, 2) : ""
      );
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.INFO) {
      console.info(
        "[DevBolt]",
        message,
        meta ? JSON.stringify(meta, null, 2) : ""
      );
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(
        "[DevBolt Warning]",
        message,
        meta ? JSON.stringify(meta, null, 2) : ""
      );
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(
        "[DevBolt Error]",
        message,
        meta ? JSON.stringify(meta, null, 2) : ""
      );
    }
  }
}

/**
 * Create a logger instance
 */
export function createLogger(level: LogLevel = LogLevel.WARN): Logger {
  if (level === LogLevel.NONE) {
    return new NoOpLogger();
  }
  return new ConsoleLogger(level);
}
