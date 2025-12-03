import ora from "ora";
import { ConfigManager } from "../utils/config-manager.js";
import { displayError } from "../utils/display.js";
import chalk from "chalk";

/**
 * Validate config file syntax
 */
export function validateCommand(): void {
  const configManager = new ConfigManager();

  if (!configManager.exists()) {
    displayError('Config file not found. Run "devbolt init" first.');
    process.exit(1);
  }

  const spinner = ora("Validating configuration...").start();

  try {
    const config = configManager.getAllFlags();

    // Validate each flag
    let flagCount = 0;
    let ruleCount = 0;

    for (const flagConfig of Object.values(config)) {
      flagCount++;

      if (flagConfig.targeting) {
        ruleCount += flagConfig.targeting.length;
      }
    }

    spinner.succeed(chalk.green("Config file is valid ✓"));

    console.log(`\n  ${chalk.bold("Flags:")} ${flagCount}`);
    console.log(`  ${chalk.bold("Targeting Rules:")} ${ruleCount}`);
    console.log();
  } catch (error) {
    spinner.fail(chalk.red("Config validation failed"));
    displayError((error as Error).message);
    process.exit(1);
  }
}
