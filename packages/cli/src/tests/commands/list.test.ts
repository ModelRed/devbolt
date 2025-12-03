import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { listCommand } from "../../commands/list.js";
import { ConfigManager } from "../../utils/config-manager.js";
import { createTempDir, cleanupTempDir } from "../setup.js";

describe("list command", () => {
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

  it("lists all flags in table format", () => {
    manager.write({
      flag_a: { enabled: true },
      flag_b: { enabled: false },
    });

    listCommand({});

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("lists flags in JSON format", () => {
    manager.write({
      flag_a: { enabled: true },
    });

    listCommand({ format: "json" });

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('"flag_a"');
  });

  it("lists flags in YAML format", () => {
    manager.write({
      flag_a: { enabled: true },
    });

    listCommand({ format: "yaml" });

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain("flag_a");
  });

  it("filters by environment", () => {
    manager.write({
      flag_with_env: {
        enabled: true,
        environments: { production: true },
      },
      flag_without_env: {
        enabled: true,
      },
    });

    listCommand({ environment: "production" });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("throws when config file does not exist", () => {
    cleanupTempDir(testDir);
    testDir = createTempDir();
    process.chdir(testDir);

    expect(() => listCommand({})).toThrow();
  });
});
