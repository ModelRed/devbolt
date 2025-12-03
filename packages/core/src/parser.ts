import { parse as parseYAML } from "yaml";
import { readFileSync } from "fs";
import type { FlagsConfig } from "./types.js";
import { ConfigParseError, ValidationError } from "./types.js";
import { ConfigValidator } from "./validator.js";

/**
 * Parses and validates feature flag configurations
 */
export class ConfigParser {
  /**
   * Parse YAML string into config
   */
  static parseYAML(content: string): FlagsConfig {
    try {
      const parsed = parseYAML(content);

      if (parsed === null || parsed === undefined) {
        return {};
      }

      if (typeof parsed !== "object") {
        throw new ValidationError("Config must be a YAML object");
      }

      ConfigValidator.validate(parsed);
      return parsed as FlagsConfig;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ConfigParseError(
        `Failed to parse YAML: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Parse config from file
   */
  static parseFile(filePath: string): FlagsConfig {
    try {
      const content = readFileSync(filePath, "utf-8");
      return this.parseYAML(content);
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof ConfigParseError
      ) {
        throw error;
      }

      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ConfigParseError(`Config file not found: ${filePath}`);
      }

      throw new ConfigParseError(
        `Failed to read config file: ${(error as Error).message}`,
        error as Error
      );
    }
  }
}
