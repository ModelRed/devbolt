import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { statusCommand } from "../../commands/status.js";
import { ConfigManager } from "../../utils/config-manager.js";
import { createTempDir, cleanupTempDir } from "../setup.js";

describe("status command", () => {
  let testDir: string;
  let configPath: string;
  let manager: ConfigManager;
  let consoleLogSpy: any;

  beforeEach(() => {
    testDir = createTempDir();
    configPath = `${testDir}/.devbolt/flags.yml`;
    process.chdir(testDir);
    manager = new ConfigManager(configPath);
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupTempDir(testDir);
    vi.restoreAllMocks();
  });

  it("shows flag status", () => {
    manager.write({ test_flag: { enabled: true } });

    statusCommand("test_flag", {});

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join(" ");
    expect(output).toContain("ENABLED");
  });

  it("evaluates with user context", () => {
    manager.write({
      rollout_flag: {
        enabled: true,
        rollout: { percentage: 50 },
      },
    });

    statusCommand("rollout_flag", { userId: "user-123" });

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls.flat().join(" ");
    expect(output).toContain("user-123");
  });

  it("shows verbose metadata", () => {
    manager.write({
      rollout_flag: {
        enabled: true,
        rollout: { percentage: 50 },
      },
    });

    statusCommand("rollout_flag", { userId: "user-123", verbose: true });

    const output = consoleLogSpy.mock.calls.flat().join(" ");
    expect(output).toContain("Metadata");
  });

  it("throws when config file does not exist", () => {
    cleanupTempDir(testDir);
    testDir = createTempDir();
    process.chdir(testDir);

    expect(() => statusCommand("test_flag", {})).toThrow();
  });
});
