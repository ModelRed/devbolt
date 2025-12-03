import chalk from "chalk";
import type { StatusOptions } from "../types.js";
import { FlagEngine, type EvaluationContext } from "@devbolt/core";
import { ConfigManager } from "../utils/config-manager.js";
import { displayError } from "../utils/display.js";

/**
 * Check flag status for a given context
 */
export function statusCommand(flagName: string, options: StatusOptions): void {
  const configManager = new ConfigManager();

  if (!configManager.exists()) {
    displayError('Config file not found. Run "devbolt init" first.');
    process.exit(1);
  }

  try {
    const config = configManager.getAllFlags();
    const engine = new FlagEngine(config);

    // Build evaluation context
    const context: EvaluationContext = {};

    if (options.userId) context.userId = options.userId;
    if (options.email) context.email = options.email;
    if (options.environment) context.environment = options.environment;

    // Evaluate flag
    const result = engine.evaluate(flagName, context);

    // Display result
    console.log("\n" + chalk.bold.underline("Flag Evaluation"));
    console.log(chalk.gray("─".repeat(60)));
    console.log(chalk.bold("Flag:"), flagName);
    console.log(
      chalk.bold("Result:"),
      result.enabled ? chalk.green("ENABLED ✓") : chalk.red("DISABLED ✗")
    );
    console.log(chalk.bold("Reason:"), result.reason);

    if (Object.keys(context).length > 0) {
      console.log(chalk.bold("\nContext:"));
      for (const [key, value] of Object.entries(context)) {
        console.log(`  ${chalk.cyan(key)}: ${value}`);
      }
    }

    if (options.verbose && result.metadata) {
      console.log(chalk.bold("\nMetadata:"));
      if (result.metadata.matchedRule !== undefined) {
        console.log(`  Matched Rule: #${result.metadata.matchedRule + 1}`);
      }
      if (result.metadata.rolloutBucket !== undefined) {
        console.log(`  Rollout Bucket: ${result.metadata.rolloutBucket}`);
      }
      console.log(
        `  Timestamp: ${new Date(result.metadata.timestamp).toISOString()}`
      );
    }

    console.log();
  } catch (error) {
    displayError(`Failed to evaluate flag: ${(error as Error).message}`);
    process.exit(1);
  }
}
