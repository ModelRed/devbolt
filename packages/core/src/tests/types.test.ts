import { describe, it, expect } from "vitest";
import {
  DevBoltError,
  ValidationError,
  FlagNotFoundError,
  ConfigParseError,
  TARGETING_OPERATORS,
} from "../types.js";

describe("DevBolt Errors", () => {
  describe("DevBoltError", () => {
    it("creates error with message and code", () => {
      const error = new DevBoltError("Test error", "TEST_ERROR");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.name).toBe("DevBoltError");
      expect(error instanceof Error).toBe(true);
    });

    it("includes optional details", () => {
      const error = new DevBoltError("Test error", "TEST_ERROR", {
        key: "value",
      });

      expect(error.details).toEqual({ key: "value" });
    });
  });

  describe("ValidationError", () => {
    it("creates validation error", () => {
      const error = new ValidationError(
        "Invalid value",
        "fieldName",
        "badValue"
      );

      expect(error.message).toBe("Invalid value");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.field).toBe("fieldName");
      expect(error.value).toBe("badValue");
      expect(error.name).toBe("ValidationError");
    });

    it("works without field and value", () => {
      const error = new ValidationError("Invalid config");

      expect(error.field).toBeUndefined();
      expect(error.value).toBeUndefined();
    });
  });

  describe("FlagNotFoundError", () => {
    it("creates flag not found error", () => {
      const error = new FlagNotFoundError("my_flag");

      expect(error.message).toBe('Flag "my_flag" not found');
      expect(error.code).toBe("FLAG_NOT_FOUND");
      expect(error.flagName).toBe("my_flag");
      expect(error.name).toBe("FlagNotFoundError");
    });
  });

  describe("ConfigParseError", () => {
    it("creates config parse error", () => {
      const error = new ConfigParseError("Failed to parse");

      expect(error.message).toBe("Failed to parse");
      expect(error.code).toBe("CONFIG_PARSE_ERROR");
      expect(error.name).toBe("ConfigParseError");
    });

    it("includes cause error message", () => {
      const cause = new Error("Original error");
      const error = new ConfigParseError("Failed to parse", cause);

      expect(error.details?.cause).toBe("Original error");
    });
  });
});

describe("TARGETING_OPERATORS", () => {
  it("exports all operators", () => {
    expect(TARGETING_OPERATORS).toContain("equals");
    expect(TARGETING_OPERATORS).toContain("not_equals");
    expect(TARGETING_OPERATORS).toContain("in");
    expect(TARGETING_OPERATORS).toContain("not_in");
    expect(TARGETING_OPERATORS).toContain("contains");
    expect(TARGETING_OPERATORS).toContain("not_contains");
    expect(TARGETING_OPERATORS).toContain("starts_with");
    expect(TARGETING_OPERATORS).toContain("ends_with");
    expect(TARGETING_OPERATORS).toContain("greater_than");
    expect(TARGETING_OPERATORS).toContain("less_than");
    expect(TARGETING_OPERATORS).toContain("greater_than_or_equal");
    expect(TARGETING_OPERATORS).toContain("less_than_or_equal");
    expect(TARGETING_OPERATORS).toContain("matches_regex");
  });

  it("has correct length", () => {
    expect(TARGETING_OPERATORS.length).toBe(13);
  });
});
