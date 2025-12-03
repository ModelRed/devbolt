import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ConfigManager } from "../utils/config-manager.js";
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import { createTempDir, cleanupTempDir } from "./setup.js";

describe("ConfigManager", () => {
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

  describe("exists", () => {
    it("returns false when config does not exist", () => {
      expect(manager.exists()).toBe(false);
    });

    it("returns true when config exists", () => {
      mkdirSync(`${testDir}/.devbolt`, { recursive: true });
      writeFileSync(configPath, "test_flag:\n  enabled: true\n");
      expect(manager.exists()).toBe(true);
    });
  });

  describe("read", () => {
    it("reads valid config", () => {
      mkdirSync(`${testDir}/.devbolt`, { recursive: true });
      writeFileSync(
        configPath,
        `
test_flag:
  enabled: true
  description: "Test"
`
      );

      const config = manager.read();
      expect(config.test_flag).toBeDefined();
      expect(config.test_flag?.enabled).toBe(true);
    });

    it("throws when config does not exist", () => {
      expect(() => manager.read()).toThrow("not found");
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

      expect(() => manager.read()).toThrow("Invalid config");
    });
  });

  describe("write", () => {
    it("writes config to file", () => {
      const config = {
        test_flag: {
          enabled: true,
          description: "Test flag",
        },
      };

      manager.write(config);

      expect(existsSync(configPath)).toBe(true);
      const content = readFileSync(configPath, "utf-8");
      expect(content).toContain("test_flag");
      expect(content).toContain("enabled: true");
    });

    it("creates directory if it does not exist", () => {
      const config = {
        test_flag: { enabled: true },
      };

      manager.write(config);

      expect(existsSync(configPath)).toBe(true);
    });

    it("writes complex config correctly", () => {
      const config = {
        complex_flag: {
          enabled: true,
          description: "Complex",
          rollout: { percentage: 50, seed: "custom" },
          targeting: [
            {
              attribute: "email",
              operator: "ends_with" as const,
              value: "@company.com",
              enabled: true,
            },
          ],
          environments: {
            production: false,
            staging: true,
          },
          metadata: {
            owner: "team-a",
          },
        },
      };

      manager.write(config);

      const readConfig = manager.read();
      expect(readConfig.complex_flag?.rollout?.percentage).toBe(50);
      expect(readConfig.complex_flag?.targeting).toHaveLength(1);
      expect(readConfig.complex_flag?.environments?.production).toBe(false);
    });

    it("overwrites existing config", () => {
      manager.write({ flag_a: { enabled: true } });
      manager.write({ flag_b: { enabled: false } });

      const config = manager.read();
      expect(config.flag_a).toBeUndefined();
      expect(config.flag_b).toBeDefined();
    });
  });

  describe("setFlag", () => {
    it("adds new flag to empty config", () => {
      manager.setFlag("new_flag", { enabled: true });

      const config = manager.read();
      expect(config.new_flag?.enabled).toBe(true);
    });

    it("adds flag to existing config", () => {
      manager.write({ existing_flag: { enabled: true } });
      manager.setFlag("new_flag", { enabled: false });

      const config = manager.read();
      expect(config.existing_flag).toBeDefined();
      expect(config.new_flag?.enabled).toBe(false);
    });

    it("overwrites existing flag", () => {
      manager.write({ test_flag: { enabled: false } });
      manager.setFlag("test_flag", { enabled: true, description: "Updated" });

      const config = manager.read();
      expect(config.test_flag?.enabled).toBe(true);
      expect(config.test_flag?.description).toBe("Updated");
    });
  });

  describe("updateFlag", () => {
    it("updates existing flag", () => {
      manager.write({
        test_flag: {
          enabled: false,
          description: "Original",
        },
      });

      manager.updateFlag("test_flag", { enabled: true });

      const config = manager.read();
      expect(config.test_flag?.enabled).toBe(true);
      expect(config.test_flag?.description).toBe("Original"); // Preserved
    });

    it("throws when flag does not exist", () => {
      manager.write({ other_flag: { enabled: true } });

      expect(() =>
        manager.updateFlag("missing_flag", { enabled: true })
      ).toThrow("not found");
    });

    it("partially updates flag", () => {
      manager.write({
        test_flag: {
          enabled: true,
          description: "Test",
          rollout: { percentage: 50 },
        },
      });

      manager.updateFlag("test_flag", { description: "Updated" });

      const config = manager.read();
      expect(config.test_flag?.enabled).toBe(true);
      expect(config.test_flag?.description).toBe("Updated");
      expect(config.test_flag?.rollout?.percentage).toBe(50);
    });
  });

  describe("removeFlag", () => {
    it("removes existing flag", () => {
      manager.write({
        flag_a: { enabled: true },
        flag_b: { enabled: false },
      });

      manager.removeFlag("flag_a");

      const config = manager.read();
      expect(config.flag_a).toBeUndefined();
      expect(config.flag_b).toBeDefined();
    });

    it("throws when flag does not exist", () => {
      manager.write({ other_flag: { enabled: true } });

      expect(() => manager.removeFlag("missing_flag")).toThrow("not found");
    });
  });

  describe("getFlag", () => {
    it("returns existing flag", () => {
      manager.write({
        test_flag: {
          enabled: true,
          description: "Test",
        },
      });

      const flag = manager.getFlag("test_flag");
      expect(flag).toBeDefined();
      expect(flag?.enabled).toBe(true);
      expect(flag?.description).toBe("Test");
    });

    it("returns undefined for missing flag", () => {
      manager.write({ other_flag: { enabled: true } });

      expect(manager.getFlag("missing_flag")).toBeUndefined();
    });
  });

  describe("getAllFlags", () => {
    it("returns all flags", () => {
      const config = {
        flag_a: { enabled: true },
        flag_b: { enabled: false },
        flag_c: { enabled: true },
      };

      manager.write(config);

      const flags = manager.getAllFlags();
      expect(Object.keys(flags)).toHaveLength(3);
      expect(flags.flag_a?.enabled).toBe(true);
      expect(flags.flag_b?.enabled).toBe(false);
    });

    it("returns empty object for no flags", () => {
      manager.write({});

      const flags = manager.getAllFlags();
      expect(flags).toEqual({});
    });
  });
});
