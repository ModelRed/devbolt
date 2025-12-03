import { existsSync } from "fs";
import { resolve } from "path";
import type { FlagsConfig, Logger } from "@devbolt/core";
import { ConfigParser, ConfigParseError } from "@devbolt/core";

/**
 * Handles loading and finding configuration files
 */
export class ConfigLoader {
  private static readonly DEFAULT_LOCATIONS = [
    ".devbolt/flags.yml",
    ".devbolt/flags.yaml",
    "devbolt.yml",
    "devbolt.yaml",
    ".devbolt.yml",
    ".devbolt.yaml",
  ];

  constructor(private readonly logger: Logger) {}

  /**
   * Find config file in standard locations
   */
  findConfigPath(customPath?: string): string {
    if (customPath) {
      const resolved = resolve(process.cwd(), customPath);
      if (!existsSync(resolved)) {
        throw new ConfigParseError(`Config file not found: ${resolved}`);
      }
      return resolved;
    }

    for (const location of ConfigLoader.DEFAULT_LOCATIONS) {
      const fullPath = resolve(process.cwd(), location);
      if (existsSync(fullPath)) {
        this.logger.debug(`Found config file at: ${fullPath}`);
        return fullPath;
      }
    }

    const searchedPaths = ConfigLoader.DEFAULT_LOCATIONS.join("\n  - ");
    throw new ConfigParseError(
      `DevBolt config file not found. Run "devbolt init" or specify configPath option.\n\nSearched locations:\n  - ${searchedPaths}`
    );
  }

  /**
   * Load configuration from file
   */
  loadConfig(filePath: string): FlagsConfig {
    try {
      this.logger.debug(`Loading config from: ${filePath}`);
      const config = ConfigParser.parseFile(filePath);
      this.logger.info(`Config loaded successfully`, {
        flagCount: Object.keys(config).length,
        path: filePath,
      });
      return config;
    } catch (error) {
      this.logger.error(`Failed to load config`, { error, path: filePath });
      throw error;
    }
  }
}
