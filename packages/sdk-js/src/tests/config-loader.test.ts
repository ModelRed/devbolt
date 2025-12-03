import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ConfigLoader } from "../config-loader.js";
import { NoOpLogger } from "@devbolt/core";
import { writeFileSync, mkdirSync } from "fs";
import { createTempDir, cleanupTempDir } from "./setup.js";

describe("ConfigLoader", () => {
  let testDir: string;
  let loader: ConfigLoader;

  beforeEach(() => {
    testDir = createTempDir();
    process.chdir(testDir);
    loader = new ConfigLoader(new NoOpLogger());
  });

  afterEach(() => {
    cleanupTempDir(testDir);
  });

  describe("findConfigPath", () => {
    it("finds config in .devbolt/flags.yml", () => {
      mkdirSync(".devbolt", { recursive: true });
      writeFileSync(".devbolt/flags.yml", "test_flag:\n  enabled: true\n");

      const path = loader.findConfigPath();
      expect(path).toContain("flags.yml");
    });

    it("finds config in .devbolt/flags.yaml", () => {
      mkdirSync(".devbolt", { recursive: true });
      writeFileSync(".devbolt/flags.yaml", "test_flag:\n  enabled: true\n");

      const path = loader.findConfigPath();
      expect(path).toContain("flags.yaml");
    });

    it("accepts custom path", () => {
      writeFileSync("custom.yml", "test_flag:\n  enabled: true\n");

      const path = loader.findConfigPath("custom.yml");
      expect(path).toContain("custom.yml");
    });

    it("throws when custom path does not exist", () => {
      expect(() => loader.findConfigPath("nonexistent.yml")).toThrow(
        /not found/
      );
    });

    it("throws when no config found in standard locations", () => {
      expect(() => loader.findConfigPath()).toThrow(/not found/);
    });
  });

  describe("loadConfig", () => {
    it("loads valid config", () => {
      const configPath = `${testDir}/flags.yml`;
      writeFileSync(
        configPath,
        `
test_flag:
  enabled: true
  description: "Test"
`
      );

      const config = loader.loadConfig(configPath);
      expect(config.test_flag).toBeDefined();
      expect(config.test_flag?.enabled).toBe(true);
    });

    it("throws on invalid YAML", () => {
      const configPath = `${testDir}/flags.yml`;
      writeFileSync(configPath, "invalid: yaml: content:");

      expect(() => loader.loadConfig(configPath)).toThrow();
    });

    it("throws on validation error", () => {
      const configPath = `${testDir}/flags.yml`;
      writeFileSync(
        configPath,
        `
InvalidFlagName:
  enabled: true
`
      );

      expect(() => loader.loadConfig(configPath)).toThrow();
    });

    it("throws when file does not exist", () => {
      expect(() => loader.loadConfig("/nonexistent/path.yml")).toThrow();
    });
  });
});
