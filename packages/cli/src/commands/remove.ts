import inquirer from "inquirer";
import type { RemoveOptions } from "../types.js";
import { ConfigManager } from "../utils/config-manager.js";
import { displaySuccess, displayError } from "../utils/display.js";

/**
 * Remove a feature flag
 */
export async function removeCommand(
  flagName: string,
  options: RemoveOptions
): Promise<void> {
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

    // Confirm deletion unless --force
    if (!options.force) {
      const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
          type: "confirm",
          name: "confirm",
          message: `Are you sure you want to remove flag "${flagName}"?`,
          default: false,
        },
      ]);

      if (!confirm) {
        console.log("Removal cancelled");
        return;
      }
    }

    configManager.removeFlag(flagName);
    displaySuccess(`Flag "${flagName}" removed`);
  } catch (error) {
    displayError(`Failed to remove flag: ${(error as Error).message}`);
    process.exit(1);
  }
}
