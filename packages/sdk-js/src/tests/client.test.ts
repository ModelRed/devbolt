import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DevBoltClient } from "../client.js";
import { LogLevel } from "@devbolt/core";
import { mkdirSync, writeFileSync } from "fs";
import { createTempDir, cleanupTempDir } from "./setup.js";

describe("DevBoltClient", () => {
  let testDir: string;
  let configPath: string;

  beforeEach(() => {
    testDir = createTempDir();
    configPath = `${testDir}/flags.yml`;
    process.chdir(testDir);
  });

  afterEach(() => {
    cleanupTempDir(testDir);
  });

  describe("initialization", () => {
    it("initializes with valid config", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client.isInitialized()).toBe(true);
      expect(client.getAllFlags()).toContain("test_flag");

      client.destroy();
    });

    it("throws on missing config when throwOnError is true", () => {
      expect(
        () =>
          new DevBoltClient({
            configPath: "/nonexistent/path.yml",
            throwOnError: true,
            logger: LogLevel.NONE,
          })
      ).toThrow();
    });

    it("does not throw on missing config when throwOnError is false", () => {
      const client = new DevBoltClient({
        configPath: "/nonexistent/path.yml",
        throwOnError: false,
        logger: LogLevel.NONE,
      });

      expect(client.isInitialized()).toBe(false);

      client.destroy();
    });

    it("finds config automatically in standard locations", () => {
      mkdirSync(".devbolt", { recursive: true });
      writeFileSync(".devbolt/flags.yml", "test_flag:\n  enabled: true\n", {
        recursive: true,
      } as any);

      const client = new DevBoltClient({
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client.isInitialized()).toBe(true);
      expect(client.getAllFlags()).toContain("test_flag");

      client.destroy();
    });
  });

  describe("flag evaluation", () => {
    it("evaluates simple enabled flag", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client.isEnabled("test_flag")).toBe(true);

      client.destroy();
    });

    it("evaluates simple disabled flag", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: false\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client.isEnabled("test_flag")).toBe(false);

      client.destroy();
    });

    it("evaluates rollout flag deterministically", () => {
      writeFileSync(
        configPath,
        `
test_flag:
  enabled: true
  rollout:
    percentage: 50
`
      );

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      const result1 = client.isEnabled("test_flag", { userId: "user-123" });
      const result2 = client.isEnabled("test_flag", { userId: "user-123" });

      expect(result1).toBe(result2);

      client.destroy();
    });

    it("evaluates targeted flag", () => {
      writeFileSync(
        configPath,
        `
test_flag:
  enabled: true
  targeting:
    - attribute: email
      operator: ends_with
      value: "@company.com"
      enabled: true
`
      );

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client.isEnabled("test_flag", { email: "john@company.com" })).toBe(
        true
      );
      expect(client.isEnabled("test_flag", { email: "john@other.com" })).toBe(
        true
      ); // Falls through

      client.destroy();
    });

    it("evaluates environment-specific flag", () => {
      writeFileSync(
        configPath,
        `
test_flag:
  enabled: true
  environments:
    production: false
    staging: true
`
      );

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client.isEnabled("test_flag", { environment: "production" })).toBe(
        false
      );
      expect(client.isEnabled("test_flag", { environment: "staging" })).toBe(
        true
      );

      client.destroy();
    });

    it("returns detailed evaluation result", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      const result = client.evaluate("test_flag");

      expect(result.flagName).toBe("test_flag");
      expect(result.enabled).toBe(true);
      expect(result.reason).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();

      client.destroy();
    });
  });

  describe("fallback values", () => {
    it("uses fallback for missing flag", () => {
      writeFileSync(configPath, "existing_flag:\n  enabled: true\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
        strict: false, // Non-strict mode
        fallbacks: {
          missing_flag: true,
        },
      });

      expect(client.isEnabled("missing_flag")).toBe(false); // Engine returns disabled
      expect(client.isEnabled("existing_flag")).toBe(true);

      client.destroy();
    });

    it("uses default fallback (false) when not specified", () => {
      writeFileSync(configPath, "existing_flag:\n  enabled: true\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client.isEnabled("missing_flag")).toBe(false);

      client.destroy();
    });
  });

  describe("default context", () => {
    it("merges default context with provided context", () => {
      writeFileSync(
        configPath,
        `
test_flag:
  enabled: true
  targeting:
    - attribute: email
      operator: ends_with
      value: "@company.com"
      enabled: true
`
      );

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
        defaultContext: {
          email: "default@company.com",
        },
      });

      // Uses default context
      expect(client.isEnabled("test_flag")).toBe(true);

      // Override default context
      expect(client.isEnabled("test_flag", { email: "other@other.com" })).toBe(
        true
      );

      client.destroy();
    });
  });

  describe("callbacks", () => {
    it("calls onFlagEvaluated callback", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");

      let callbackCalled = false;
      let capturedResult: any;

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
        onFlagEvaluated: (result, _) => {
          callbackCalled = true;
          capturedResult = result;
        },
      });

      client.isEnabled("test_flag");

      expect(callbackCalled).toBe(true);
      expect(capturedResult.flagName).toBe("test_flag");

      client.destroy();
    });

    it("does not break on callback errors", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
        onFlagEvaluated: () => {
          throw new Error("Callback error");
        },
      });

      // Should not throw
      expect(() => client.isEnabled("test_flag")).not.toThrow();

      client.destroy();
    });

    it("calls onError callback", () => {
      writeFileSync(configPath, "InvalidFlag:\n  enabled: true\n");

      let errorCalled = false;

      const client = new DevBoltClient({
        configPath: "/nonexistent/path.yml",
        throwOnError: false,
        logger: LogLevel.NONE,
        onError: (_) => {
          errorCalled = true;
        },
      });

      expect(errorCalled).toBe(true);

      client.destroy();
    });

    it("calls onConfigUpdate callback on manual reload", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: false\n");

      let updateCalled = false;
      let capturedConfig: any;

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
        onConfigUpdate: (config) => {
          updateCalled = true;
          capturedConfig = config;
        },
      });

      // Update file
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");

      // Manual reload
      client.reload();

      expect(updateCalled).toBe(true);
      expect(capturedConfig.test_flag?.enabled).toBe(true);

      client.destroy();
    });
  });

  describe("manual reload", () => {
    it("reloads config manually", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: false\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      expect(client.isEnabled("test_flag")).toBe(false);

      // Update config
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");

      // Reload
      client.reload();

      expect(client.isEnabled("test_flag")).toBe(true);

      client.destroy();
    });
  });

  describe("state management", () => {
    it("returns correct state", () => {
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      const state = client.getState();

      expect(state.initialized).toBe(true);
      expect(state.configPath).toContain("flags.yml");
      expect(state.lastLoadTime).toBeGreaterThan(0);
      expect(state.errorCount).toBe(0);

      client.destroy();
    });
  });

  describe("helper methods", () => {
    it("getAllFlags returns all flag names", () => {
      writeFileSync(
        configPath,
        `
flag_a:
  enabled: true
flag_b:
  enabled: false
flag_c:
  enabled: true
`
      );

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      const flags = client.getAllFlags();

      expect(flags).toHaveLength(3);
      expect(flags).toContain("flag_a");
      expect(flags).toContain("flag_b");
      expect(flags).toContain("flag_c");

      client.destroy();
    });

    it("getFlagConfig returns flag configuration", () => {
      writeFileSync(
        configPath,
        `
test_flag:
  enabled: true
  description: "Test flag"
  rollout:
    percentage: 50
`
      );

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      const flagConfig = client.getFlagConfig("test_flag");

      expect(flagConfig).toBeDefined();
      expect(flagConfig?.enabled).toBe(true);
      expect(flagConfig?.description).toBe("Test flag");
      expect(flagConfig?.rollout?.percentage).toBe(50);

      client.destroy();
    });

    it("getConfig returns entire configuration", () => {
      writeFileSync(
        configPath,
        `
flag_a:
  enabled: true
flag_b:
  enabled: false
`
      );

      const client = new DevBoltClient({
        configPath,
        autoReload: false,
        logger: LogLevel.NONE,
      });

      const config = client.getConfig();

      expect(config.flag_a).toBeDefined();
      expect(config.flag_b).toBeDefined();

      client.destroy();
    });
  });

  describe("cleanup", () => {
    it("cleans up resources on destroy", async () => {
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");

      const client = new DevBoltClient({
        configPath,
        autoReload: true,
        logger: LogLevel.NONE,
      });

      expect(client.isInitialized()).toBe(true);

      await client.destroy();

      expect(client.isInitialized()).toBe(false);
    });
  });
});
