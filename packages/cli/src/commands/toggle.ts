import type { ToggleOptions } from "../types.js";
import { ConfigManager } from "../utils/config-manager.js";
import { displaySuccess, displayError } from "../utils/display.js";

/**
 * Toggle a flag on or off
 */
export function toggleCommand(
  flagName: string,
  state?: boolean,
  options: ToggleOptions = {}
): void {
  const configManager = new ConfigManager();

  if (!configManager.exists()) {
    displayError('Config file not found. Run "devbolt init" first.');
    process.exit(1);
  }

  try {
    const flag = configManager.getFlag(flagName);

    if (!flag) {
      displayError(`Flag "${flagName}" not found`);
      process.exit(1);
    }

    // Handle environment-specific toggle
    if (options.environment) {
      const env = options.environment;
      const newState =
        state !== undefined
          ? state
          : !(flag.environments?.[env] ?? flag.enabled);

      configManager.updateFlag(flagName, {
        environments: {
          ...flag.environments,
          [env]: newState,
        },
      });

      const stateText = newState ? "enabled" : "disabled";
      displaySuccess(
        `Flag "${flagName}" ${stateText} for environment "${env}"`
      );
    } else {
      // Global toggle
      const currentEnabled =
        typeof flag.enabled === "boolean"
          ? flag.enabled
          : Boolean(flag.enabled);

      const newState = state !== undefined ? state : !currentEnabled;

      configManager.updateFlag(flagName, { enabled: newState });

      const stateText = newState ? "enabled" : "disabled";
      displaySuccess(`Flag "${flagName}" ${stateText} globally`);
    }
  } catch (error) {
    displayError(`Failed to toggle flag: ${(error as Error).message}`);
    process.exit(1);
  }
}
