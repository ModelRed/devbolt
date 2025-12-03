import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { toggleCommand } from "../../commands/toggle.js";
import { ConfigManager } from "../../utils/config-manager.js";
import { createTempDir, cleanupTempDir } from "../setup.js";

describe("toggle command", () => {
  let testDir: string;
  let configPath: string;
  let manager: ConfigManager;

  beforeEach(() => {
    testDir = createTempDir();
    configPath = `${testDir}/.devbolt/flags.yml`;
    process.chdir(testDir);
    manager = new ConfigManager(configPath);
  });

  afterEach(() => {
    cleanupTempDir(testDir);
  });

  it("toggles flag from false to true", () => {
    manager.write({ test_flag: { enabled: false } });

    toggleCommand("test_flag", true);

    const config = manager.read();
    expect(config.test_flag?.enabled).toBe(true);
  });

  it("toggles flag from true to false", () => {
    manager.write({ test_flag: { enabled: true } });

    toggleCommand("test_flag", false);

    const config = manager.read();
    expect(config.test_flag?.enabled).toBe(false);
  });

  it("toggles flag without explicit state", () => {
    manager.write({ test_flag: { enabled: false } });

    toggleCommand("test_flag");

    const config = manager.read();
    expect(config.test_flag?.enabled).toBe(true);
  });

  it("toggles environment-specific flag", () => {
    manager.write({
      test_flag: {
        enabled: true,
        environments: { production: false },
      },
    });

    toggleCommand("test_flag", true, { environment: "production" });

    const config = manager.read();
    expect(config.test_flag?.environments?.production).toBe(true);
  });

  it("throws when flag does not exist", () => {
    manager.write({});

    expect(() => toggleCommand("missing_flag")).toThrow();
  });

  it("throws when config file does not exist", () => {
    cleanupTempDir(testDir);
    testDir = createTempDir();
    process.chdir(testDir);

    expect(() => toggleCommand("test_flag")).toThrow();
  });
});
