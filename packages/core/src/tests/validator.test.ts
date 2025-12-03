import { describe, it, expect } from "vitest";
import { ConfigValidator } from "../validator.js";
import { ValidationError, type FlagsConfig } from "../types.js";

describe("ConfigValidator", () => {
  describe("validate - basic structure", () => {
    it("accepts empty config", () => {
      expect(() => ConfigValidator.validate({})).not.toThrow();
    });

    it("accepts valid simple flag", () => {
      const config: FlagsConfig = {
        test_flag: {
          enabled: true,
          description: "Test flag",
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it("rejects non-object config", () => {
      expect(() => ConfigValidator.validate(null as any)).toThrow(
        ValidationError
      );
      expect(() => ConfigValidator.validate([] as any)).toThrow(
        ValidationError
      );
      expect(() => ConfigValidator.validate("string" as any)).toThrow(
        ValidationError
      );
      expect(() => ConfigValidator.validate(123 as any)).toThrow(
        ValidationError
      );
    });
  });

  describe("flag name validation", () => {
    it("accepts valid flag names", () => {
      const validNames = [
        "test_flag",
        "test-flag",
        "test123",
        "a",
        "flag_name_with_numbers_123",
        "flag-with-many-dashes",
      ];

      validNames.forEach((name) => {
        const config = { [name]: { enabled: true } };
        expect(() => ConfigValidator.validate(config)).not.toThrow();
      });
    });

    it("rejects flag names with uppercase", () => {
      expect(() =>
        ConfigValidator.validate({ InvalidFlag: { enabled: true } })
      ).toThrow(ValidationError);
      expect(() =>
        ConfigValidator.validate({ TestFlag: { enabled: true } })
      ).toThrow(ValidationError);
    });

    it("rejects flag names with spaces", () => {
      expect(() =>
        ConfigValidator.validate({ "flag with spaces": { enabled: true } })
      ).toThrow(ValidationError);
    });

    it("rejects flag names with special characters", () => {
      expect(() =>
        ConfigValidator.validate({ "flag@special": { enabled: true } })
      ).toThrow(ValidationError);
      expect(() =>
        ConfigValidator.validate({ "flag!name": { enabled: true } })
      ).toThrow(ValidationError);
    });

    it("rejects empty flag name", () => {
      expect(() => ConfigValidator.validate({ "": { enabled: true } })).toThrow(
        ValidationError
      );
    });

    it("rejects flag name exceeding max length", () => {
      const longName = "a".repeat(101);
      expect(() =>
        ConfigValidator.validate({ [longName]: { enabled: true } })
      ).toThrow(ValidationError);
    });
  });

  describe("enabled field validation", () => {
    it("requires enabled field", () => {
      const config = {
        test_flag: {
          description: "Missing enabled",
        } as any,
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });

    it("requires enabled to be boolean", () => {
      const invalidValues = ["true", 1, "yes", null];

      invalidValues.forEach((value) => {
        const config = {
          test_flag: {
            enabled: value as any,
          },
        };
        expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
      });
    });

    it("accepts true and false", () => {
      expect(() =>
        ConfigValidator.validate({ test_flag: { enabled: true } })
      ).not.toThrow();
      expect(() =>
        ConfigValidator.validate({ test_flag: { enabled: false } })
      ).not.toThrow();
    });
  });

  describe("description validation", () => {
    it("accepts valid description", () => {
      const config: FlagsConfig = {
        test_flag: {
          enabled: true,
          description: "This is a valid description",
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it("rejects non-string description", () => {
      const config = {
        test_flag: {
          enabled: true,
          description: 123 as any,
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });

    it("rejects description exceeding max length", () => {
      const config = {
        test_flag: {
          enabled: true,
          description: "a".repeat(501),
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });

    it("accepts description at max length", () => {
      const config = {
        test_flag: {
          enabled: true,
          description: "a".repeat(500),
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });
  });

  describe("rollout validation", () => {
    it("accepts valid rollout", () => {
      const config: FlagsConfig = {
        test_flag: {
          enabled: true,
          rollout: { percentage: 50 },
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it("accepts rollout with seed", () => {
      const config: FlagsConfig = {
        test_flag: {
          enabled: true,
          rollout: { percentage: 50, seed: "custom" },
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it("rejects non-object rollout", () => {
      const config = {
        test_flag: {
          enabled: true,
          rollout: 50 as any,
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });

    it("rejects non-numeric percentage", () => {
      const config = {
        test_flag: {
          enabled: true,
          rollout: { percentage: "50" as any },
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });

    it("rejects percentage out of range", () => {
      expect(() =>
        ConfigValidator.validate({
          test_flag: { enabled: true, rollout: { percentage: -1 } },
        })
      ).toThrow(ValidationError);

      expect(() =>
        ConfigValidator.validate({
          test_flag: { enabled: true, rollout: { percentage: 101 } },
        })
      ).toThrow(ValidationError);
    });

    it("rejects non-finite percentage", () => {
      expect(() =>
        ConfigValidator.validate({
          test_flag: { enabled: true, rollout: { percentage: NaN } },
        })
      ).toThrow(ValidationError);

      expect(() =>
        ConfigValidator.validate({
          test_flag: { enabled: true, rollout: { percentage: Infinity } },
        })
      ).toThrow(ValidationError);
    });

    it("accepts edge case percentages", () => {
      [0, 100, 0.5, 50.5, 99.9].forEach((percentage) => {
        const config = {
          test_flag: {
            enabled: true,
            rollout: { percentage },
          },
        };
        expect(() => ConfigValidator.validate(config)).not.toThrow();
      });
    });

    it("rejects non-string seed", () => {
      const config = {
        test_flag: {
          enabled: true,
          rollout: { percentage: 50, seed: 123 as any },
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });
  });

  describe("targeting validation", () => {
    it("accepts valid targeting rules", () => {
      const config: FlagsConfig = {
        test_flag: {
          enabled: true,
          targeting: [
            {
              attribute: "email",
              operator: "ends_with",
              value: "@example.com",
              enabled: true,
            },
          ],
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it("rejects non-array targeting", () => {
      const config = {
        test_flag: {
          enabled: true,
          targeting: {} as any,
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });

    it("rejects non-object rule", () => {
      const config = {
        test_flag: {
          enabled: true,
          targeting: ["not an object"] as any,
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });

    it("rejects invalid operator", () => {
      const config = {
        test_flag: {
          enabled: true,
          targeting: [
            {
              attribute: "email",
              operator: "invalid_op" as any,
              value: "test",
              enabled: true,
            },
          ],
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });

    it("requires values array for in/not_in operators", () => {
      expect(() =>
        ConfigValidator.validate({
          test_flag: {
            enabled: true,
            targeting: [
              {
                attribute: "userId",
                operator: "in",
                value: "user-1",
                enabled: true,
              } as any,
            ],
          },
        })
      ).toThrow(ValidationError);
    });

    it("requires value for non-in operators", () => {
      expect(() =>
        ConfigValidator.validate({
          test_flag: {
            enabled: true,
            targeting: [
              {
                attribute: "email",
                operator: "equals",
                enabled: true,
              } as any,
            ],
          },
        })
      ).toThrow(ValidationError);
    });

    it("validates regex patterns", () => {
      const invalidConfig = {
        test_flag: {
          enabled: true,
          targeting: [
            {
              attribute: "email",
              operator: "matches_regex" as const,
              value: "[invalid(regex",
              enabled: true,
            },
          ],
        },
      };
      expect(() => ConfigValidator.validate(invalidConfig)).toThrow(
        ValidationError
      );

      const validConfig = {
        test_flag: {
          enabled: true,
          targeting: [
            {
              attribute: "email",
              operator: "matches_regex" as const,
              value: "^[a-z]+@example\\.com$",
              enabled: true,
            },
          ],
        },
      };
      expect(() => ConfigValidator.validate(validConfig)).not.toThrow();
    });

    it("accepts optional description", () => {
      const config: FlagsConfig = {
        test_flag: {
          enabled: true,
          targeting: [
            {
              attribute: "email",
              operator: "equals",
              value: "test@example.com",
              enabled: true,
              description: "For test users",
            },
          ],
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });
  });

  describe("environments validation", () => {
    it("accepts valid environments", () => {
      const config: FlagsConfig = {
        test_flag: {
          enabled: true,
          environments: {
            production: false,
            staging: true,
            development: true,
          },
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it("rejects non-object environments", () => {
      const config = {
        test_flag: {
          enabled: true,
          environments: [] as any,
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });

    it("rejects non-boolean environment values", () => {
      const config = {
        test_flag: {
          enabled: true,
          environments: {
            production: "false" as any,
          },
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });
  });

  describe("metadata validation", () => {
    it("accepts valid metadata", () => {
      const config: FlagsConfig = {
        test_flag: {
          enabled: true,
          metadata: {
            owner: "team-a",
            jira: "PROJ-123",
            created: "2024-01-01",
          },
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it("rejects non-object metadata", () => {
      const config = {
        test_flag: {
          enabled: true,
          metadata: [] as any,
        },
      };
      expect(() => ConfigValidator.validate(config)).toThrow(ValidationError);
    });
  });

  describe("complex configurations", () => {
    it("validates complex flag with all fields", () => {
      const config: FlagsConfig = {
        complex_flag: {
          enabled: true,
          description: "A complex flag",
          rollout: {
            percentage: 50,
            seed: "custom",
          },
          targeting: [
            {
              attribute: "email",
              operator: "ends_with",
              value: "@company.com",
              enabled: true,
              description: "Company employees",
            },
            {
              attribute: "userId",
              operator: "in",
              values: ["user-1", "user-2"],
              enabled: true,
            },
          ],
          environments: {
            production: false,
            staging: true,
          },
          metadata: {
            owner: "platform-team",
            jira: "PROJ-123",
          },
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it("validates multiple flags", () => {
      const config: FlagsConfig = {
        flag_a: { enabled: true },
        flag_b: { enabled: false },
        flag_c: {
          enabled: true,
          rollout: { percentage: 25 },
        },
      };
      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });
  });
});
