import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initCommand } from "../../commands/init.js";
import { ConfigManager } from "../../utils/config-manager.js";
import { createTempDir, cleanupTempDir } from "../setup.js";
import inquirer from "inquirer";

vi.mock("inquirer");

describe("init command", () => {
  let testDir: string;
  let configPath: string;

  beforeEach(() => {
    testDir = createTempDir();
    configPath = `${testDir}/.devbolt/flags.yml`;
    process.chdir(testDir);
  });

  afterEach(() => {
    cleanupTempDir(testDir);
    vi.restoreAllMocks();
  });

  it("creates config with example flags", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({ createExample: true });

    await initCommand();

    const manager = new ConfigManager(configPath);
    expect(manager.exists()).toBe(true);

    const config = manager.read();
    expect(config.example_feature).toBeDefined();
    expect(config.gradual_rollout).toBeDefined();
    expect(config.environment_specific).toBeDefined();
    expect(config.targeted_feature).toBeDefined();
  });

  it("creates empty config without examples", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({ createExample: false });

    await initCommand();

    const manager = new ConfigManager(configPath);
    expect(manager.exists()).toBe(true);

    const config = manager.read();
    expect(Object.keys(config)).toHaveLength(0);
  });

  it("prompts for overwrite when config exists", async () => {
    // Create existing config
    const manager = new ConfigManager(configPath);
    manager.write({ existing_flag: { enabled: true } });

    vi.mocked(inquirer.prompt)
      .mockResolvedValueOnce({ overwrite: true })
      .mockResolvedValueOnce({ createExample: false });

    await initCommand();

    expect(vi.mocked(inquirer.prompt)).toHaveBeenCalledTimes(2);
  });

  it("cancels when user declines overwrite", async () => {
    // Create existing config
    const manager = new ConfigManager(configPath);
    manager.write({ existing_flag: { enabled: true } });

    vi.mocked(inquirer.prompt).mockResolvedValue({ overwrite: false });

    await initCommand();

    // Config should remain unchanged
    const config = manager.read();
    expect(config.existing_flag).toBeDefined();
    expect(config.example_feature).toBeUndefined();
  });
});
