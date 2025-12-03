import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  displaySuccess,
  displayError,
  displayWarning,
  displayInfo,
  displayFlagTable,
  displayFlagDetail,
  displayJson,
  displayYaml,
} from "../utils/display.js";
import type { FlagsConfig } from "@devbolt/core";

describe("Display Utilities", () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("displaySuccess", () => {
    it("logs success message with checkmark", () => {
      displaySuccess("Operation completed");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("✓"));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Operation completed")
      );
    });
  });

  describe("displayError", () => {
    it("logs error message with X mark", () => {
      displayError("Operation failed");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("✗")
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Operation failed")
      );
    });
  });

  describe("displayWarning", () => {
    it("logs warning message with warning symbol", () => {
      displayWarning("Be careful");
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("⚠"));
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Be careful")
      );
    });
  });

  describe("displayInfo", () => {
    it("logs info message with info symbol", () => {
      displayInfo("For your information");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("ℹ"));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("For your information")
      );
    });
  });

  describe("displayFlagTable", () => {
    it("displays table for flags", () => {
      const flags: FlagsConfig = {
        test_flag: {
          enabled: true,
          description: "Test",
        },
        rollout_flag: {
          enabled: true,
          rollout: { percentage: 50 },
        },
      };

      displayFlagTable(flags);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("displays message for empty flags", () => {
      displayFlagTable({});
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No flags found")
      );
    });

    it("handles flags with all properties", () => {
      const flags: FlagsConfig = {
        complex_flag: {
          enabled: true,
          rollout: { percentage: 75 },
          targeting: [
            {
              attribute: "email",
              operator: "equals",
              value: "test@example.com",
              enabled: true,
            },
          ],
          environments: {
            production: false,
            staging: true,
          },
        },
      };

      displayFlagTable(flags);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe("displayFlagDetail", () => {
    it("displays detailed flag information", () => {
      displayFlagDetail("test_flag", {
        enabled: true,
        description: "Test flag",
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat().join(" ");
      expect(calls).toContain("test_flag");
      expect(calls).toContain("Yes");
    });

    it("displays rollout information", () => {
      displayFlagDetail("rollout_flag", {
        enabled: true,
        rollout: { percentage: 50, seed: "custom" },
      });

      const calls = consoleLogSpy.mock.calls.flat().join(" ");
      expect(calls).toContain("50%");
      expect(calls).toContain("custom");
    });

    it("displays targeting rules", () => {
      displayFlagDetail("targeted_flag", {
        enabled: true,
        targeting: [
          {
            attribute: "email",
            operator: "ends_with",
            value: "@company.com",
            enabled: true,
            description: "Company employees",
          },
        ],
      });

      const calls = consoleLogSpy.mock.calls.flat().join(" ");
      expect(calls).toContain("email");
      expect(calls).toContain("ends_with");
      expect(calls).toContain("Company employees");
    });

    it("displays environments", () => {
      displayFlagDetail("env_flag", {
        enabled: true,
        environments: {
          production: false,
          staging: true,
        },
      });

      const calls = consoleLogSpy.mock.calls.flat().join(" ");
      expect(calls).toContain("production");
      expect(calls).toContain("staging");
    });

    it("displays metadata", () => {
      displayFlagDetail("metadata_flag", {
        enabled: true,
        metadata: {
          owner: "team-a",
          jira: "PROJ-123",
        },
      });

      const calls = consoleLogSpy.mock.calls.flat().join(" ");
      expect(calls).toContain("team-a");
      expect(calls).toContain("PROJ-123");
    });
  });

  describe("displayJson", () => {
    it("displays JSON formatted data", () => {
      const data = { test: "value", number: 123 };
      displayJson(data);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"test"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"value"')
      );
    });

    it("pretty prints JSON", () => {
      displayJson({ a: 1, b: 2 });

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain("\n"); // Should have newlines (pretty print)
    });
  });

  describe("displayYaml", () => {
    it("displays YAML formatted data", () => {
      const data = { test: "value", number: 123 };
      displayYaml(data);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain("test:");
      expect(output).toContain("value");
    });

    it("formats nested objects", () => {
      const data = {
        parent: {
          child: "value",
        },
      };
      displayYaml(data);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
