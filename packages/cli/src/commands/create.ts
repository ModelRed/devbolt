import inquirer from "inquirer";
import type { CreateOptions } from "../types.js";
import { ConfigManager } from "../utils/config-manager.js";
import { displaySuccess, displayError } from "../utils/display.js";
import type { FlagConfig } from "@devbolt/core";

/**
 * Create a new feature flag
 */
export async function createCommand(
  flagName: string,
  options: CreateOptions
): Promise<void> {
  const configManager = new ConfigManager();

  // Check if config exists
  if (!configManager.exists()) {
    displayError('Config file not found. Run "devbolt init" first.');
    process.exit(1);
  }

  // Check if flag already exists
  const existingFlag = configManager.getFlag(flagName);
  if (existingFlag) {
    displayError(
      `Flag "${flagName}" already exists. Use "devbolt show ${flagName}" to view it.`
    );
    process.exit(1);
  }

  let enabled = options.enabled;
  let description = options.description;
  let rolloutPercentage = options.rollout;

  // Interactive prompts if not provided via options
  if (!options.yes) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "description",
        message: "Description:",
        default: `Feature flag for ${flagName}`,
        when: () => description === undefined,
      },
      {
        type: "confirm",
        name: "enabled",
        message: "Enable this flag?",
        default: true,
        when: () => enabled === undefined,
      },
      {
        type: "confirm",
        name: "addRollout",
        message: "Add gradual rollout?",
        default: false,
        when: () => rolloutPercentage === undefined,
      },
      {
        type: "number",
        name: "rolloutPercentage",
        message: "Rollout percentage (0-100):",
        default: 0,
        validate: (value: number) => {
          if (value < 0 || value > 100) {
            return "Please enter a number between 0 and 100";
          }
          return true;
        },
        when: (answers: any) => answers.addRollout === true,
      },
    ]);

    enabled = answers.enabled ?? enabled ?? true;
    description = answers.description ?? description;
    rolloutPercentage = answers.rolloutPercentage;
  }

  const normalizedEnabled = typeof enabled === "boolean" ? enabled : true;

  // Build flag config
  const flagConfig: FlagConfig = {
    enabled: normalizedEnabled,
    description: description ?? "",
  };

  if (rolloutPercentage !== undefined && rolloutPercentage >= 0) {
    flagConfig.rollout = { percentage: rolloutPercentage };
  }

  try {
    configManager.setFlag(flagName, flagConfig);
    displaySuccess(`Flag "${flagName}" created successfully!`);

    if (rolloutPercentage !== undefined && rolloutPercentage > 0) {
      console.log(`Rollout set to ${rolloutPercentage}%`);
    }
  } catch (error) {
    displayError(`Failed to create flag: ${(error as Error).message}`);
    process.exit(1);
  }
}
