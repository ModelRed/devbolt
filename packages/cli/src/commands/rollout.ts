import type { RolloutOptions } from "../types.js";
import { ConfigManager } from "../utils/config-manager.js";
import { displaySuccess, displayError, displayInfo } from "../utils/display.js";

/**
 * Set rollout percentage for a flag
 */
export function rolloutCommand(
  flagName: string,
  percentage: number,
  _options: RolloutOptions = {}
): void {
  const configManager = new ConfigManager();

  if (!configManager.exists()) {
    displayError('Config file not found. Run "devbolt init" first.');
    process.exit(1);
  }

  if (percentage < 0 || percentage > 100) {
    displayError("Percentage must be between 0 and 100");
    process.exit(1);
  }

  try {
    const flag = configManager.getFlag(flagName);

    if (!flag) {
      displayError(`Flag "${flagName}" not found`);
      process.exit(1);
    }

    configManager.updateFlag(flagName, {
      rollout: { percentage },
    });

    displaySuccess(`Rollout for "${flagName}" set to ${percentage}%`);

    if (percentage === 0) {
      displayInfo("Flag is now disabled for all users (0% rollout)");
    } else if (percentage === 100) {
      displayInfo("Flag is now enabled for all users (100% rollout)");
    } else {
      displayInfo(
        `Approximately ${percentage}% of users will see this flag enabled`
      );
    }
  } catch (error) {
    displayError(`Failed to set rollout: ${(error as Error).message}`);
    process.exit(1);
  }
}
