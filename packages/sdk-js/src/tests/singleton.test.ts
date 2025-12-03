import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  initialize,
  isEnabled,
  evaluate,
  getInstance,
  destroy,
  isInitialized,
} from "../singleton.js";
import { LogLevel } from "@devbolt/core";
import { writeFileSync } from "fs";
import { createTempDir, cleanupTempDir } from "./setup.js";

describe("Singleton API", () => {
  let testDir: string;
  let configPath: string;

  beforeEach(() => {
    testDir = createTempDir();
    configPath = `${testDir}/flags.yml`;
    process.chdir(testDir);

    writeFileSync(configPath, "test_flag:\n  enabled: true\n");
  });

  afterEach(async () => {
    await destroy();
    cleanupTempDir(testDir);
  });

  describe("initialize", () => {
    it("initializes singleton instance", () => {
      const client = initialize({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client).toBeDefined();
      expect(client.isInitialized()).toBe(true);
    });

    it("replaces existing instance", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: false\n");

      const client2 = initialize({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client2).toBeDefined();
      expect(client2.isEnabled("test_flag")).toBe(false);
    });
  });

  describe("isEnabled", () => {
    it("checks flag status", () => {
      initialize({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(isEnabled("test_flag")).toBe(true);
    });

    it("throws when not initialized", () => {
      expect(() => isEnabled("test_flag")).toThrow(/not initialized/);
    });
  });

  describe("evaluate", () => {
    it("evaluates flag", () => {
      initialize({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      const result = evaluate("test_flag");

      expect(result.flagName).toBe("test_flag");
      expect(result.enabled).toBe(true);
    });

    it("throws when not initialized", () => {
      expect(() => evaluate("test_flag")).toThrow(/not initialized/);
    });
  });

  describe("getInstance", () => {
    it("returns singleton instance", () => {
      const client = initialize({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      const instance = getInstance();

      expect(instance).toBe(client);
    });

    it("throws when not initialized", () => {
      expect(() => getInstance()).toThrow(/not initialized/);
    });
  });

  describe("destroy", () => {
    it("destroys singleton instance", async () => {
      initialize({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(isInitialized()).toBe(true);

      await destroy();

      expect(isInitialized()).toBe(false);
    });

    it("does not throw when not initialized", async () => {
      await expect(destroy()).resolves.not.toThrow();
    });
  });

  describe("isInitialized", () => {
    it("returns false when not initialized", () => {
      expect(isInitialized()).toBe(false);
    });

    it("returns true when initialized", () => {
      initialize({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(isInitialized()).toBe(true);
    });
  });
});
