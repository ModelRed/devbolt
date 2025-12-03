import type { ListOptions } from "../types.js";
import { ConfigManager } from "../utils/config-manager.js";
import {
  displayError,
  displayFlagTable,
  displayJson,
  displayYaml,
} from "../utils/display.js";

/**
 * List all feature flags
 */
export function listCommand(options: ListOptions): void {
  const configManager = new ConfigManager();

  if (!configManager.exists()) {
    displayError('Config file not found. Run "devbolt init" first.');
    process.exit(1);
  }

  try {
    let flags = configManager.getAllFlags();

    // Filter by environment if specified
    if (options.environment) {
      const env = options.environment;
      flags = Object.fromEntries(
        Object.entries(flags).filter(([_, config]) => {
          return config.environments && env in config.environments;
        })
      );
    }

    // Display in requested format
    const format = options.format || "table";

    switch (format) {
      case "json":
        displayJson(flags);
        break;
      case "yaml":
        displayYaml(flags);
        break;
      case "table":
      default:
        displayFlagTable(flags);
        break;
    }
  } catch (error) {
    displayError(`Failed to list flags: ${(error as Error).message}`);
    process.exit(1);
  }
}
