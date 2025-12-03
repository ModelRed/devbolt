import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ConfigParser } from "../parser.js";
import { ConfigParseError, ValidationError } from "../types.js";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("ConfigParser", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `devbolt-parser-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("parseYAML", () => {
    it("parses simple valid YAML", () => {
      const yaml = `
test_flag:
  enabled: true
  description: "Test flag"
`;
      const config = ConfigParser.parseYAML(yaml);

      expect(config.test_flag).toBeDefined();
      expect(config.test_flag?.enabled).toBe(true);
      expect(config.test_flag?.description).toBe("Test flag");
    });

    it("parses empty YAML", () => {
      const yaml = `
# Just comments
`;
      const config = ConfigParser.parseYAML(yaml);

      // Empty or comments-only YAML should return empty object or null
      expect(config).toBeDefined();
      if (config !== null) {
        expect(Object.keys(config).length).toBe(0);
      }
    });

    it("parses YAML with multiple flags", () => {
      const yaml = `
flag_a:
  enabled: true
flag_b:
  enabled: false
flag_c:
  enabled: true
  rollout:
    percentage: 50
`;
      const config = ConfigParser.parseYAML(yaml);

      expect(Object.keys(config)).toHaveLength(3);
      expect(config.flag_a?.enabled).toBe(true);
      expect(config.flag_b?.enabled).toBe(false);
      expect(config.flag_c?.rollout?.percentage).toBe(50);
    });

    it("parses complex flag configuration", () => {
      const yaml = `
complex_flag:
  enabled: true
  description: "Complex flag"
  rollout:
    percentage: 50
    seed: "custom"
  targeting:
    - attribute: email
      operator: ends_with
      value: "@company.com"
      enabled: true
      description: "Company employees"
    - attribute: userId
      operator: in
      values: ["user-1", "user-2"]
      enabled: true
  environments:
    production: false
    staging: true
  metadata:
    owner: "platform-team"
    jira: "PROJ-123"
`;
      const config = ConfigParser.parseYAML(yaml);
      const flag = config.complex_flag;

      expect(flag).toBeDefined();
      expect(flag?.enabled).toBe(true);
      expect(flag?.description).toBe("Complex flag");
      expect(flag?.rollout?.percentage).toBe(50);
      expect(flag?.rollout?.seed).toBe("custom");
      expect(flag?.targeting).toHaveLength(2);
      expect(flag?.targeting?.[0]?.operator).toBe("ends_with");
      expect(flag?.targeting?.[1]?.values).toEqual(["user-1", "user-2"]);
      expect(flag?.environments?.production).toBe(false);
      expect(flag?.metadata?.owner).toBe("platform-team");
    });

    it("throws on invalid YAML syntax", () => {
      const yaml = `
invalid: yaml: content:
  - broken
`;
      expect(() => ConfigParser.parseYAML(yaml)).toThrow(ConfigParseError);
    });

    it("throws on non-object YAML", () => {
      expect(() => ConfigParser.parseYAML("[]")).toThrow(ValidationError);
      expect(() => ConfigParser.parseYAML('"string"')).toThrow(ValidationError);
      expect(() => ConfigParser.parseYAML("123")).toThrow(ValidationError);
    });

    it("throws on validation errors", () => {
      const yaml = `
InvalidFlagName:
  enabled: true
`;
      expect(() => ConfigParser.parseYAML(yaml)).toThrow(ValidationError);
    });

    it("handles YAML with comments", () => {
      const yaml = `
# This is a comment
test_flag:
  enabled: true # inline comment
  description: "Test"
`;
      const config = ConfigParser.parseYAML(yaml);

      expect(config.test_flag?.enabled).toBe(true);
    });

    it("handles boolean values", () => {
      const yaml = `
test_flag:
  enabled: true
  environments:
    production: false
    staging: true
    development: false
`;
      const config = ConfigParser.parseYAML(yaml);

      expect(config.test_flag?.enabled).toBe(true);
      expect(config.test_flag?.environments?.production).toBe(false);
      expect(config.test_flag?.environments?.staging).toBe(true);
      expect(config.test_flag?.environments?.development).toBe(false);
    });

    it("handles numeric values in targeting", () => {
      const yaml = `
test_flag:
  enabled: true
  targeting:
    - attribute: age
      operator: greater_than
      value: 18
      enabled: true
    - attribute: scores
      operator: in
      values: [100, 200, 300]
      enabled: true
`;
      const config = ConfigParser.parseYAML(yaml);

      expect(config.test_flag?.targeting?.[0]?.value).toBe(18);
      expect(config.test_flag?.targeting?.[1]?.values).toEqual([100, 200, 300]);
    });
  });

  describe("parseFile", () => {
    it("parses valid config file", () => {
      const filePath = join(testDir, "flags.yml");
      writeFileSync(
        filePath,
        `
test_flag:
  enabled: true
  description: "From file"
`
      );

      const config = ConfigParser.parseFile(filePath);

      expect(config.test_flag).toBeDefined();
      expect(config.test_flag?.enabled).toBe(true);
      expect(config.test_flag?.description).toBe("From file");
    });

    it("throws when file does not exist", () => {
      const filePath = join(testDir, "nonexistent.yml");

      expect(() => ConfigParser.parseFile(filePath)).toThrow(ConfigParseError);
      expect(() => ConfigParser.parseFile(filePath)).toThrow(/not found/);
    });

    it("throws on invalid YAML in file", () => {
      const filePath = join(testDir, "invalid.yml");
      writeFileSync(filePath, "invalid: yaml: content:");

      expect(() => ConfigParser.parseFile(filePath)).toThrow(ConfigParseError);
    });

    it("throws on validation error in file", () => {
      const filePath = join(testDir, "invalid-config.yml");
      writeFileSync(
        filePath,
        `
InvalidFlagName:
  enabled: true
`
      );

      expect(() => ConfigParser.parseFile(filePath)).toThrow(ValidationError);
    });

    it("handles .yaml extension", () => {
      const filePath = join(testDir, "flags.yaml");
      writeFileSync(
        filePath,
        `
test_flag:
  enabled: true
`
      );

      const config = ConfigParser.parseFile(filePath);
      expect(config.test_flag?.enabled).toBe(true);
    });

    it("handles UTF-8 content", () => {
      const filePath = join(testDir, "flags.yml");
      writeFileSync(
        filePath,
        `
test_flag:
  enabled: true
  description: "Unicode: 你好 👋 café"
`,
        "utf-8"
      );

      const config = ConfigParser.parseFile(filePath);
      expect(config.test_flag?.description).toBe("Unicode: 你好 👋 café");
    });

    it("handles empty file", () => {
      const filePath = join(testDir, "empty.yml");
      writeFileSync(filePath, "");

      const config = ConfigParser.parseFile(filePath);
      expect(config).toBeDefined();
      if (config !== null) {
        expect(Object.keys(config).length).toBe(0);
      }
    });

    it("handles file with only comments", () => {
      const filePath = join(testDir, "comments.yml");
      writeFileSync(
        filePath,
        `
# Only comments
# No actual config
`
      );

      const config = ConfigParser.parseFile(filePath);
      expect(config).toBeDefined();
      if (config !== null) {
        expect(Object.keys(config).length).toBe(0);
      }
    });
  });

  describe("edge cases", () => {
    it("handles large configuration files", () => {
      const flags: string[] = [];
      for (let i = 0; i < 100; i++) {
        flags.push(`
flag_${i}:
  enabled: ${i % 2 === 0}
  description: "Flag number ${i}"
  rollout:
    percentage: ${i}
`);
      }

      const yaml = flags.join("\n");
      const config = ConfigParser.parseYAML(yaml);

      expect(Object.keys(config)).toHaveLength(100);
      expect(config.flag_0?.enabled).toBe(true);
      expect(config.flag_50?.rollout?.percentage).toBe(50);
    });

    it("preserves order of flags", () => {
      const yaml = `
z_flag:
  enabled: true
a_flag:
  enabled: true
m_flag:
  enabled: true
`;
      const config = ConfigParser.parseYAML(yaml);
      const keys = Object.keys(config);

      expect(keys).toEqual(["z_flag", "a_flag", "m_flag"]);
    });

    it("handles nested objects in metadata", () => {
      const yaml = `
test_flag:
  enabled: true
  metadata:
    nested:
      deeply:
        value: "test"
    array: [1, 2, 3]
`;
      const config = ConfigParser.parseYAML(yaml);

      expect(config.test_flag?.metadata?.nested).toBeDefined();
      expect(config.test_flag?.metadata?.array).toEqual([1, 2, 3]);
    });
  });
});
