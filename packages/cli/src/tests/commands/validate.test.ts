import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateCommand } from "../../commands/validate.js";
import { ConfigManager } from "../../utils/config-manager.js";
import { createTempDir, cleanupTempDir } from "../setup.js";
import { mkdirSync, writeFileSync } from "fs";

describe("validate command", () => {
  let testDir: string;
  let configPath: string;
  let manager: ConfigManager;

  beforeEach(() => {
    testDir = createTempDir();
    configPath = `${testDir}/.devbolt/flags.yml`;
    process.chdir(testDir);
    manager = new ConfigManager(configPath);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTempDir(testDir);
    vi.restoreAllMocks();
  });

  it("validates correct config", () => {
    manager.write({
      test_flag: { enabled: true },
      another_flag: { enabled: false },
    });

    expect(() => validateCommand()).not.toThrow();
  });

  it("throws on invalid config", () => {
    mkdirSync(`${testDir}/.devbolt`, { recursive: true });
    writeFileSync(
      configPath,
      `
InvalidFlagName:
  enabled: true
`
    );

    expect(() => validateCommand()).toThrow();
  });

  it("throws when config file does not exist", () => {
    cleanupTempDir(testDir);
    testDir = createTempDir();
    process.chdir(testDir);

    expect(() => validateCommand()).toThrow();
  });
});
