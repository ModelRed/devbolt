import { ConfigManager } from "../utils/config-manager.js";
import { displayError, displayFlagDetail } from "../utils/display.js";

/**
 * Show details of a specific flag
 */
export function showCommand(flagName: string): void {
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

    displayFlagDetail(flagName, flag);
  } catch (error) {
    displayError(`Failed to show flag: ${(error as Error).message}`);
    process.exit(1);
  }
}
