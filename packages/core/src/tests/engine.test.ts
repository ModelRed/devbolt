import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FlagEngine } from "../engine.js";
import { FlagNotFoundError, LogLevel } from "../types.js";
import { createLogger } from "../logger.js";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("FlagEngine", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `devbolt-engine-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("constructor", () => {
    it("creates engine with valid config", () => {
      const config = {
        test_flag: {
          enabled: true,
        },
      };

      const engine = new FlagEngine(config);
      expect(engine.getAllFlags()).toContain("test_flag");
    });

    it("accepts logger option", () => {
      const config = {
        test_flag: { enabled: true },
      };

      const engine = new FlagEngine(config, {
        logger: createLogger(LogLevel.DEBUG),
      });
      expect(engine).toBeDefined();
    });

    it("accepts strict mode option", () => {
      const config = {
        test_flag: { enabled: true },
      };

      const engine = new FlagEngine(config, { strict: true });
      expect(engine).toBeDefined();
    });
  });

  describe("fromYAML", () => {
    it("creates engine from YAML string", () => {
      const yaml = `
test_flag:
  enabled: true
  description: "Test"
`;
      const engine = FlagEngine.fromYAML(yaml);

      expect(engine.getAllFlags()).toContain("test_flag");
      expect(engine.isEnabled("test_flag")).toBe(true);
    });

    it("throws on invalid YAML", () => {
      const yaml = "invalid: yaml: content:";
      expect(() => FlagEngine.fromYAML(yaml)).toThrow();
    });

    it("accepts options", () => {
      const yaml = "test_flag:\n  enabled: true";
      const engine = FlagEngine.fromYAML(yaml, { strict: true });

      expect(engine).toBeDefined();
    });
  });

  describe("fromFile", () => {
    it("creates engine from file", () => {
      const filePath = join(testDir, "flags.yml");
      writeFileSync(
        filePath,
        `
test_flag:
  enabled: true
`
      );

      const engine = FlagEngine.fromFile(filePath);
      expect(engine.isEnabled("test_flag")).toBe(true);
    });

    it("throws on missing file", () => {
      const filePath = join(testDir, "nonexistent.yml");
      expect(() => FlagEngine.fromFile(filePath)).toThrow();
    });
  });

  describe("evaluate", () => {
    it("evaluates flag correctly", () => {
      const config = {
        test_flag: {
          enabled: true,
          description: "Test flag",
        },
      };

      const engine = new FlagEngine(config);
      const result = engine.evaluate("test_flag");

      expect(result.enabled).toBe(true);
      expect(result.flagName).toBe("test_flag");
      expect(result.reason).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
    });

    it("evaluates with context", () => {
      const config = {
        rollout_flag: {
          enabled: true,
          rollout: { percentage: 50 },
        },
      };

      const engine = new FlagEngine(config);
      const result = engine.evaluate("rollout_flag", { userId: "user-123" });

      expect(result.metadata.rolloutBucket).toBeDefined();
    });

    it("returns disabled for missing flag in non-strict mode", () => {
      const config = {
        existing_flag: { enabled: true },
      };

      const engine = new FlagEngine(config);
      const result = engine.evaluate("missing_flag");

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain("not found");
    });

    it("throws for missing flag in strict mode", () => {
      const config = {
        existing_flag: { enabled: true },
      };

      const engine = new FlagEngine(config, { strict: true });

      expect(() => engine.evaluate("missing_flag")).toThrow(FlagNotFoundError);
    });

    it("handles empty context", () => {
      const config = {
        test_flag: { enabled: true },
      };

      const engine = new FlagEngine(config);
      const result = engine.evaluate("test_flag", {});

      expect(result.enabled).toBe(true);
    });

    it("handles undefined context", () => {
      const config = {
        test_flag: { enabled: true },
      };

      const engine = new FlagEngine(config);
      const result = engine.evaluate("test_flag");

      expect(result.enabled).toBe(true);
    });
  });

  describe("isEnabled", () => {
    it("returns true for enabled flag", () => {
      const config = {
        test_flag: { enabled: true },
      };

      const engine = new FlagEngine(config);
      expect(engine.isEnabled("test_flag")).toBe(true);
    });

    it("returns false for disabled flag", () => {
      const config = {
        test_flag: { enabled: false },
      };

      const engine = new FlagEngine(config);
      expect(engine.isEnabled("test_flag")).toBe(false);
    });

    it("returns false for missing flag in non-strict mode", () => {
      const config = {
        test_flag: { enabled: true },
      };

      const engine = new FlagEngine(config);
      expect(engine.isEnabled("missing_flag")).toBe(false);
    });

    it("accepts context parameter", () => {
      const config = {
        rollout_flag: {
          enabled: true,
          rollout: { percentage: 50 },
        },
      };

      const engine = new FlagEngine(config);
      const result = engine.isEnabled("rollout_flag", { userId: "user-123" });

      expect(typeof result).toBe("boolean");
    });
  });

  describe("getAllFlags", () => {
    it("returns all flag names", () => {
      const config = {
        flag_a: { enabled: true },
        flag_b: { enabled: false },
        flag_c: { enabled: true },
      };

      const engine = new FlagEngine(config);
      const flags = engine.getAllFlags();

      expect(flags).toHaveLength(3);
      expect(flags).toContain("flag_a");
      expect(flags).toContain("flag_b");
      expect(flags).toContain("flag_c");
    });

    it("returns empty array for empty config", () => {
      const engine = new FlagEngine({});
      expect(engine.getAllFlags()).toEqual([]);
    });

    it("returns flags in order", () => {
      const config = {
        z_flag: { enabled: true },
        a_flag: { enabled: true },
        m_flag: { enabled: true },
      };

      const engine = new FlagEngine(config);
      const flags = engine.getAllFlags();

      expect(flags).toEqual(["z_flag", "a_flag", "m_flag"]);
    });
  });

  describe("getFlagConfig", () => {
    it("returns flag configuration", () => {
      const config = {
        test_flag: {
          enabled: true,
          description: "Test",
          rollout: { percentage: 50 },
        },
      };

      const engine = new FlagEngine(config);
      const flagConfig = engine.getFlagConfig("test_flag");

      expect(flagConfig).toBeDefined();
      expect(flagConfig?.enabled).toBe(true);
      expect(flagConfig?.description).toBe("Test");
      expect(flagConfig?.rollout?.percentage).toBe(50);
    });

    it("returns undefined for missing flag", () => {
      const engine = new FlagEngine({});
      expect(engine.getFlagConfig("missing_flag")).toBeUndefined();
    });
  });

  describe("getConfig", () => {
    it("returns entire configuration", () => {
      const config = {
        flag_a: { enabled: true },
        flag_b: { enabled: false },
      };

      const engine = new FlagEngine(config);
      const retrievedConfig = engine.getConfig();

      expect(retrievedConfig).toEqual(config);
    });

    it("returns copy of config (frozen)", () => {
      const config = {
        test_flag: { enabled: true },
      };

      const engine = new FlagEngine(config);
      const retrievedConfig = engine.getConfig();

      // Should be frozen
      expect(Object.isFrozen(retrievedConfig)).toBe(true);
    });
  });

  describe("updateConfig", () => {
    it("updates configuration", () => {
      const initialConfig = {
        test_flag: { enabled: false },
      };

      const engine = new FlagEngine(initialConfig);
      expect(engine.isEnabled("test_flag")).toBe(false);

      const newConfig = {
        test_flag: { enabled: true },
      };

      engine.updateConfig(newConfig);
      expect(engine.isEnabled("test_flag")).toBe(true);
    });

    it("replaces entire configuration", () => {
      const initialConfig = {
        old_flag: { enabled: true },
      };

      const engine = new FlagEngine(initialConfig);
      expect(engine.getAllFlags()).toEqual(["old_flag"]);

      const newConfig = {
        new_flag: { enabled: true },
      };

      engine.updateConfig(newConfig);
      expect(engine.getAllFlags()).toEqual(["new_flag"]);
    });

    it("allows adding new flags", () => {
      const initialConfig = {
        flag_a: { enabled: true },
      };

      const engine = new FlagEngine(initialConfig);

      const newConfig = {
        flag_a: { enabled: true },
        flag_b: { enabled: true },
      };

      engine.updateConfig(newConfig);
      expect(engine.getAllFlags()).toHaveLength(2);
    });
  });

  describe("complex scenarios", () => {
    it("handles multiple flags with different configurations", () => {
      const config = {
        simple_flag: {
          enabled: true,
        },
        rollout_flag: {
          enabled: true,
          rollout: { percentage: 50 },
        },
        targeted_flag: {
          enabled: true,
          targeting: [
            {
              attribute: "email",
              operator: "ends_with" as const,
              value: "@company.com",
              enabled: true,
            },
          ],
        },
        env_flag: {
          enabled: true,
          environments: {
            production: false,
            staging: true,
          },
        },
      };

      const engine = new FlagEngine(config);

      expect(engine.isEnabled("simple_flag")).toBe(true);
      expect(
        typeof engine.isEnabled("rollout_flag", { userId: "user-123" })
      ).toBe("boolean");
      expect(
        engine.isEnabled("targeted_flag", { email: "john@company.com" })
      ).toBe(true);
      expect(engine.isEnabled("env_flag", { environment: "production" })).toBe(
        false
      );
      expect(engine.isEnabled("env_flag", { environment: "staging" })).toBe(
        true
      );
    });

    it("evaluates all flags correctly in sequence", () => {
      const config = {
        flag_1: { enabled: true },
        flag_2: { enabled: false },
        flag_3: { enabled: true },
      };

      const engine = new FlagEngine(config);

      expect(engine.isEnabled("flag_1")).toBe(true);
      expect(engine.isEnabled("flag_2")).toBe(false);
      expect(engine.isEnabled("flag_3")).toBe(true);
    });

    it("handles rapid successive evaluations", () => {
      const config = {
        test_flag: {
          enabled: true,
          rollout: { percentage: 50 },
        },
      };

      const engine = new FlagEngine(config);

      for (let i = 0; i < 100; i++) {
        const result = engine.isEnabled("test_flag", { userId: `user-${i}` });
        expect(typeof result).toBe("boolean");
      }
    });
  });

  describe("performance", () => {
    it("handles large number of flags efficiently", () => {
      const config: any = {};
      for (let i = 0; i < 1000; i++) {
        config[`flag_${i}`] = { enabled: i % 2 === 0 };
      }

      const engine = new FlagEngine(config);

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        engine.isEnabled(`flag_${i}`);
      }
      const duration = Date.now() - startTime;

      // Should complete quickly (under 100ms for 1000 evaluations)
      expect(duration).toBeLessThan(100);
    });
  });
});
