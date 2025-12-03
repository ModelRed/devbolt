import chalk from "chalk";
import inquirer from "inquirer";
import { ConfigManager } from "../utils/config-manager.js";
import {
  displaySuccess,
  displayError,
  displayWarning,
} from "../utils/display.js";

interface InitOptions {
  yes?: boolean;
  noExamples?: boolean;
}

/**
 * Initialize DevBolt in the current directory
 */
export async function initCommand(options: InitOptions = {}): Promise<void> {
  const configManager = new ConfigManager();

  // Check if config already exists
  if (configManager.exists()) {
    displayWarning("DevBolt config already exists at .devbolt/flags.yml");

    if (!options.yes) {
      const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
        {
          type: "confirm",
          name: "overwrite",
          message: "Do you want to overwrite it?",
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log("Initialization cancelled");
        return;
      }
    }
  }

  // Determine if we should create examples
  let createExample = !options.noExamples;

  if (!options.yes && !options.noExamples) {
    const response = await inquirer.prompt<{ createExample: boolean }>([
      {
        type: "confirm",
        name: "createExample",
        message: "Create example flags?",
        default: true,
      },
    ]);
    createExample = response.createExample;
  }

  const config = createExample
    ? {
        example_feature: {
          enabled: true,
          description: "Example feature flag",
        },
        gradual_rollout: {
          enabled: true,
          description: "Feature with gradual rollout",
          rollout: {
            percentage: 50,
          },
        },
        environment_specific: {
          enabled: true,
          description: "Environment-specific feature",
          environments: {
            production: false,
            staging: true,
            development: true,
          },
        },
        targeted_feature: {
          enabled: true,
          description: "Feature with user targeting",
          targeting: [
            {
              attribute: "email",
              operator: "ends_with" as const,
              value: "@company.com",
              enabled: true,
            },
          ],
        },
      }
    : {};

  try {
    configManager.write(config);
    displaySuccess("DevBolt initialized successfully!");
    console.log("\nConfig file created at:", chalk.cyan(".devbolt/flags.yml"));

    if (createExample) {
      console.log("\n" + chalk.bold("Example flags created:"));
      console.log("  • example_feature - Simple enabled flag");
      console.log("  • gradual_rollout - 50% rollout flag");
      console.log("  • environment_specific - Environment overrides");
      console.log("  • targeted_feature - User targeting rules");
    }

    console.log("\n" + chalk.bold("Next steps:"));
    console.log("  1. Run", chalk.cyan("devbolt list"), "to see your flags");
    console.log(
      "  2. Run",
      chalk.cyan("devbolt create <flag-name>"),
      "to create a new flag"
    );
    console.log("  3. Install SDK:", chalk.cyan("npm install @devbolt/sdk"));
  } catch (error) {
    displayError(`Failed to initialize: ${(error as Error).message}`);
    process.exit(1);
  }
}
