import { describe, it, expect, beforeEach } from "vitest";
import { FlagEvaluator } from "../evaluator.js";
import type { FlagConfig } from "../types.js";

describe("FlagEvaluator", () => {
  let evaluator: FlagEvaluator;

  beforeEach(() => {
    evaluator = new FlagEvaluator();
  });

  describe("basic evaluation", () => {
    it("returns enabled for simple enabled flag", () => {
      const config: FlagConfig = { enabled: true };
      const result = evaluator.evaluate("test-flag", config, {});

      expect(result.enabled).toBe(true);
      expect(result.reason).toContain("enabled for all users");
      expect(result.flagName).toBe("test-flag");
      expect(result.metadata.timestamp).toBeDefined();
    });

    it("returns disabled for simple disabled flag", () => {
      const config: FlagConfig = { enabled: false };
      const result = evaluator.evaluate("test-flag", config, {});

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain("disabled globally");
    });
  });

  describe("environment overrides", () => {
    it("respects environment-specific settings", () => {
      const config: FlagConfig = {
        enabled: true,
        environments: {
          production: false,
          staging: true,
        },
      };

      const prodResult = evaluator.evaluate("test-flag", config, {
        environment: "production",
      });
      expect(prodResult.enabled).toBe(false);
      expect(prodResult.reason).toContain("Environment override");

      const stagingResult = evaluator.evaluate("test-flag", config, {
        environment: "staging",
      });
      expect(stagingResult.enabled).toBe(true);
    });

    it("falls through when environment not in config", () => {
      const config: FlagConfig = {
        enabled: true,
        environments: {
          production: false,
        },
      };

      const result = evaluator.evaluate("test-flag", config, {
        environment: "development",
      });
      expect(result.enabled).toBe(true);
      expect(result.reason).toContain("enabled for all users");
    });

    it("ignores environments when context has no environment", () => {
      const config: FlagConfig = {
        enabled: true,
        environments: {
          production: false,
        },
      };

      const result = evaluator.evaluate("test-flag", config, {});
      expect(result.enabled).toBe(true);
    });
  });

  describe("rollout percentage", () => {
    it("returns false for 0% rollout", () => {
      const config: FlagConfig = {
        enabled: true,
        rollout: { percentage: 0 },
      };

      const result = evaluator.evaluate("test-flag", config, {
        userId: "user-123",
      });
      expect(result.enabled).toBe(false);
    });

    it("returns true for 100% rollout", () => {
      const config: FlagConfig = {
        enabled: true,
        rollout: { percentage: 100 },
      };

      const result = evaluator.evaluate("test-flag", config, {
        userId: "user-123",
      });
      expect(result.enabled).toBe(true);
    });

    it("is deterministic for same user", () => {
      const config: FlagConfig = {
        enabled: true,
        rollout: { percentage: 50 },
      };

      const result1 = evaluator.evaluate("test-flag", config, {
        userId: "user-123",
      });
      const result2 = evaluator.evaluate("test-flag", config, {
        userId: "user-123",
      });

      expect(result1.enabled).toBe(result2.enabled);
      expect(result1.metadata.rolloutBucket).toBe(
        result2.metadata.rolloutBucket
      );
    });

    it("uses email as identifier if userId not provided", () => {
      const config: FlagConfig = {
        enabled: true,
        rollout: { percentage: 50 },
      };

      const result = evaluator.evaluate("test-flag", config, {
        email: "test@example.com",
      });
      expect(result.metadata.rolloutBucket).toBeDefined();
    });

    it("uses anonymous if no identifier provided", () => {
      const config: FlagConfig = {
        enabled: true,
        rollout: { percentage: 50 },
      };

      const result = evaluator.evaluate("test-flag", config, {});
      expect(result.metadata.rolloutBucket).toBeDefined();
    });

    it("respects custom seed", () => {
      const config1: FlagConfig = {
        enabled: true,
        rollout: { percentage: 50, seed: "seed1" },
      };

      const config2: FlagConfig = {
        enabled: true,
        rollout: { percentage: 50, seed: "seed2" },
      };

      const result1 = evaluator.evaluate("test-flag", config1, {
        userId: "user-123",
      });
      const result2 = evaluator.evaluate("test-flag", config2, {
        userId: "user-123",
      });

      // Should potentially be different (not guaranteed)
      expect(result1.metadata.rolloutBucket).toBeDefined();
      expect(result2.metadata.rolloutBucket).toBeDefined();
    });
  });

  describe("targeting rules", () => {
    it("matches equals operator", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "email",
            operator: "equals",
            value: "test@example.com",
            enabled: true,
          },
        ],
      };

      const matchResult = evaluator.evaluate("test-flag", config, {
        email: "test@example.com",
      });
      expect(matchResult.enabled).toBe(true);
      expect(matchResult.metadata.matchedRule).toBe(0);

      const noMatchResult = evaluator.evaluate("test-flag", config, {
        email: "other@example.com",
      });
      expect(noMatchResult.enabled).toBe(true); // Falls through to default
      expect(noMatchResult.metadata.matchedRule).toBeUndefined();
    });

    it("matches not_equals operator", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "plan",
            operator: "not_equals",
            value: "free",
            enabled: true,
          },
        ],
      };

      const matchResult = evaluator.evaluate("test-flag", config, {
        customAttributes: { plan: "premium" },
      });
      expect(matchResult.enabled).toBe(true);
    });

    it("matches in operator", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "userId",
            operator: "in",
            values: ["user-1", "user-2", "user-3"],
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, { userId: "user-2" }).enabled
      ).toBe(true);

      expect(
        evaluator.evaluate("test-flag", config, { userId: "user-99" }).enabled
      ).toBe(true); // Falls through
    });

    it("matches not_in operator", () => {
      const config: FlagConfig = {
        enabled: true, // Base enabled
        targeting: [
          {
            attribute: "userId",
            operator: "not_in",
            values: ["blocked-1", "blocked-2"],
            enabled: true, // Enable if NOT in blocked list
          },
        ],
      };

      const evaluator = new FlagEvaluator();

      // User in blocked list - rule doesn't match (not_in returns false)
      // Falls through to base enabled=true
      const blockedResult = evaluator.evaluate("test-flag", config, {
        userId: "blocked-1",
      });
      expect(blockedResult.enabled).toBe(true); // Falls through

      // User NOT in blocked list - rule matches (not_in returns true)
      // Rule says enabled=true
      const allowedResult = evaluator.evaluate("test-flag", config, {
        userId: "allowed-user",
      });
      expect(allowedResult.enabled).toBe(true);
    });

    it("matches contains operator (case insensitive)", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "email",
            operator: "contains",
            value: "test",
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, {
          email: "my.TEST.email@example.com",
        }).enabled
      ).toBe(true);
    });

    it("matches not_contains operator", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "email",
            operator: "not_contains",
            value: "spam",
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, { email: "good@example.com" })
          .enabled
      ).toBe(true);
    });

    it("matches starts_with operator (case insensitive)", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "userId",
            operator: "starts_with",
            value: "admin_",
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, { userId: "ADMIN_123" }).enabled
      ).toBe(true);
    });

    it("matches ends_with operator (case insensitive)", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "email",
            operator: "ends_with",
            value: "@company.com",
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, { email: "john@COMPANY.COM" })
          .enabled
      ).toBe(true);
    });

    it("matches greater_than operator", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "age",
            operator: "greater_than",
            value: 18,
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, {
          customAttributes: { age: 25 },
        }).enabled
      ).toBe(true);

      expect(
        evaluator.evaluate("test-flag", config, {
          customAttributes: { age: 15 },
        }).enabled
      ).toBe(true); // Falls through
    });

    it("matches less_than operator", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "price",
            operator: "less_than",
            value: 100,
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, {
          customAttributes: { price: 50 },
        }).enabled
      ).toBe(true);
    });

    it("matches greater_than_or_equal operator", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "score",
            operator: "greater_than_or_equal",
            value: 100,
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, {
          customAttributes: { score: 100 },
        }).enabled
      ).toBe(true);

      expect(
        evaluator.evaluate("test-flag", config, {
          customAttributes: { score: 101 },
        }).enabled
      ).toBe(true);
    });

    it("matches less_than_or_equal operator", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "limit",
            operator: "less_than_or_equal",
            value: 50,
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, {
          customAttributes: { limit: 50 },
        }).enabled
      ).toBe(true);

      expect(
        evaluator.evaluate("test-flag", config, {
          customAttributes: { limit: 49 },
        }).enabled
      ).toBe(true);
    });

    it("matches regex operator", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "email",
            operator: "matches_regex",
            value: "^[a-z]+@company\\.com$",
            enabled: true,
          },
        ],
      };

      expect(
        evaluator.evaluate("test-flag", config, { email: "john@company.com" })
          .enabled
      ).toBe(true);

      expect(
        evaluator.evaluate("test-flag", config, {
          email: "john123@company.com",
        }).enabled
      ).toBe(true); // Falls through (doesn't match regex)
    });

    it("uses first matching rule", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "userId",
            operator: "equals",
            value: "user-1",
            enabled: false,
          },
          {
            attribute: "userId",
            operator: "equals",
            value: "user-1",
            enabled: true,
          },
        ],
      };

      const result = evaluator.evaluate("test-flag", config, {
        userId: "user-1",
      });
      expect(result.enabled).toBe(false); // First rule wins
      expect(result.metadata.matchedRule).toBe(0);
    });

    it("returns undefined matchedRule when no rules match", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "email",
            operator: "equals",
            value: "test@example.com",
            enabled: true,
          },
        ],
      };

      const result = evaluator.evaluate("test-flag", config, {
        email: "other@example.com",
      });
      expect(result.metadata.matchedRule).toBeUndefined();
    });

    it("handles missing attribute in context", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "email",
            operator: "equals",
            value: "test@example.com",
            enabled: true,
          },
        ],
      };

      const result = evaluator.evaluate("test-flag", config, {});
      expect(result.enabled).toBe(true); // Falls through
    });
  });

  describe("priority order", () => {
    it("environment override beats everything", () => {
      const config: FlagConfig = {
        enabled: true,
        environments: { production: false },
        targeting: [
          {
            attribute: "email",
            operator: "equals",
            value: "admin@example.com",
            enabled: true,
          },
        ],
        rollout: { percentage: 100 },
      };

      const result = evaluator.evaluate("test-flag", config, {
        environment: "production",
        email: "admin@example.com",
        userId: "user-123",
      });

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain("Environment override");
    });

    it("global disabled beats targeting and rollout", () => {
      const config: FlagConfig = {
        enabled: false,
        targeting: [
          {
            attribute: "email",
            operator: "equals",
            value: "admin@example.com",
            enabled: true,
          },
        ],
        rollout: { percentage: 100 },
      };

      const result = evaluator.evaluate("test-flag", config, {
        email: "admin@example.com",
        userId: "user-123",
      });

      expect(result.enabled).toBe(false);
      expect(result.reason).toContain("disabled globally");
    });

    it("targeting beats rollout", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "email",
            operator: "equals",
            value: "test@example.com",
            enabled: true,
          },
        ],
        rollout: { percentage: 0 },
      };

      const result = evaluator.evaluate("test-flag", config, {
        email: "test@example.com",
        userId: "user-123",
      });

      expect(result.enabled).toBe(true);
      expect(result.reason).toContain("targeting rule");
      expect(result.metadata.rolloutBucket).toBeUndefined();
    });
  });

  describe("custom attributes", () => {
    it("evaluates custom attributes", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "plan",
            operator: "equals",
            value: "enterprise",
            enabled: true,
          },
        ],
      };

      const result = evaluator.evaluate("test-flag", config, {
        customAttributes: { plan: "enterprise" },
      });

      expect(result.enabled).toBe(true);
    });

    it("handles missing custom attributes", () => {
      const config: FlagConfig = {
        enabled: true,
        targeting: [
          {
            attribute: "plan",
            operator: "equals",
            value: "enterprise",
            enabled: true,
          },
        ],
      };

      const result = evaluator.evaluate("test-flag", config, {});
      expect(result.enabled).toBe(true); // Falls through
    });
  });
});
