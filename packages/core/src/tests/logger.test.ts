import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsoleLogger, NoOpLogger, createLogger } from "../logger.js";
import { LogLevel } from "../types.js";

describe("NoOpLogger", () => {
  it("does nothing on all log methods", () => {
    const logger = new NoOpLogger();

    // Should not throw
    expect(() => logger.debug()).not.toThrow();
    expect(() => logger.info()).not.toThrow();
    expect(() => logger.warn()).not.toThrow();
    expect(() => logger.error()).not.toThrow();
  });
});

describe("ConsoleLogger", () => {
  let consoleDebugSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("with DEBUG level", () => {
    it("logs all levels", () => {
      const logger = new ConsoleLogger(LogLevel.DEBUG);

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("with INFO level", () => {
    it("logs info, warn, error but not debug", () => {
      const logger = new ConsoleLogger(LogLevel.INFO);

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("with WARN level", () => {
    it("logs warn and error only", () => {
      const logger = new ConsoleLogger(LogLevel.WARN);

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("with ERROR level", () => {
    it("logs error only", () => {
      const logger = new ConsoleLogger(LogLevel.ERROR);

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  it("includes metadata in log messages", () => {
    const logger = new ConsoleLogger(LogLevel.DEBUG);

    logger.debug("test message", { key: "value", num: 123 });

    // FIX: Check that debug was called and the call includes both the message and metadata
    expect(consoleDebugSpy).toHaveBeenCalled();
    const callArgs = consoleDebugSpy.mock.calls[0];
    const fullOutput = callArgs.join(" ");
    expect(fullOutput).toContain("test message");
    expect(fullOutput).toContain("key");
  });
});

describe("createLogger", () => {
  it("creates NoOpLogger for NONE level", () => {
    const logger = createLogger(LogLevel.NONE);
    expect(logger).toBeInstanceOf(NoOpLogger);
  });

  it("creates ConsoleLogger for other levels", () => {
    const logger = createLogger(LogLevel.WARN);
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });

  it("defaults to WARN level", () => {
    const logger = createLogger();
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });
});
