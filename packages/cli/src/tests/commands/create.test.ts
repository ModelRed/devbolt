import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createCommand } from "../../commands/create.js";
import { ConfigManager } from "../../utils/config-manager.js";
import { createTempDir, cleanupTempDir } from "../setup.js";
import inquirer from "inquirer";

vi.mock("inquirer");

describe("create command", () => {
  let testDir: string;
  let configPath: string;
  let manager: ConfigManager;

  beforeEach(() => {
    testDir = createTempDir();
    configPath = `${testDir}/.devbolt/flags.yml`;
    process.chdir(testDir);
    manager = new ConfigManager(configPath);
    manager.write({}); // Create empty config
  });

  afterEach(() => {
    cleanupTempDir(testDir);
    vi.restoreAllMocks();
  });

  it("creates flag with provided options", async () => {
    await createCommand("new_flag", {
      enabled: true,
      description: "Test flag",
      rollout: 50,
      yes: true,
    });

    const config = manager.read();
    expect(config.new_flag).toBeDefined();
    expect(config.new_flag?.enabled).toBe(true);
    expect(config.new_flag?.description).toBe("Test flag");
    expect(config.new_flag?.rollout?.percentage).toBe(50);
  });

  it("prompts for options when not provided", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      description: "Interactive flag",
      enabled: true,
      addRollout: false,
    });

    await createCommand("interactive_flag", {});

    const config = manager.read();
    expect(config.interactive_flag).toBeDefined();
    expect(config.interactive_flag?.description).toBe("Interactive flag");
  });

  it("creates flag with rollout when prompted", async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      description: "Rollout flag",
      enabled: true,
      addRollout: true,
      rolloutPercentage: 75,
    });

    await createCommand("rollout_flag", {});

    const config = manager.read();
    expect(config.rollout_flag?.rollout?.percentage).toBe(75);
  });

  it("throws when flag already exists", async () => {
    manager.setFlag("existing_flag", { enabled: true });

    await expect(
      createCommand("existing_flag", { yes: true })
    ).rejects.toThrow();
  });

  it("throws when config file does not exist", async () => {
    cleanupTempDir(testDir);
    testDir = createTempDir();
    process.chdir(testDir);

    await expect(createCommand("new_flag", { yes: true })).rejects.toThrow();
  });
});
