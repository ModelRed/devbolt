#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { createCommand } from "./commands/create.js";
import { listCommand } from "./commands/list.js";
import { showCommand } from "./commands/show.js";
import { toggleCommand } from "./commands/toggle.js";
import { rolloutCommand } from "./commands/rollout.js";
import { removeCommand } from "./commands/remove.js";
import { statusCommand } from "./commands/status.js";
import { validateCommand } from "./commands/validate.js";

const program = new Command();

program
  .name("devbolt")
  .description("DevBolt - Git-native feature flags for developers")
  .version("0.1.0");

// Init command
program
  .command("init")
  .description("Initialize DevBolt in the current directory")
  .action(initCommand);

// Create command
program
  .command("create <flag-name>")
  .description("Create a new feature flag")
  .option("-e, --enabled", "Enable the flag immediately")
  .option("-d, --description <description>", "Flag description")
  .option(
    "-r, --rollout <percentage>",
    "Set rollout percentage (0-100)",
    parseFloat
  )
  .option("-y, --yes", "Skip interactive prompts")
  .action(createCommand);

// List command
program
  .command("list")
  .alias("ls")
  .description("List all feature flags")
  .option("--environment <env>", "Filter by environment")
  .option("--format <format>", "Output format (table|json|yaml)", "table")
  .action(listCommand);

// Show command
program
  .command("show <flag-name>")
  .description("Show detailed information about a flag")
  .action(showCommand);

// Toggle command
program
  .command("toggle <flag-name>")
  .description("Toggle a flag on/off")
  .option("--environment <env>", "Toggle for specific environment")
  .action(toggleCommand);

// Enable command
program
  .command("enable <flag-name>")
  .description("Enable a flag")
  .option("--environment <env>", "Enable for specific environment")
  .action((flagName, options) => toggleCommand(flagName, true, options));

// Disable command
program
  .command("disable <flag-name>")
  .description("Disable a flag")
  .option("--environment <env>", "Disable for specific environment")
  .action((flagName, options) => toggleCommand(flagName, false, options));

// Rollout command
program
  .command("rollout <flag-name> <percentage>")
  .description("Set rollout percentage for a flag")
  .action((flagName, percentage) =>
    rolloutCommand(flagName, parseFloat(percentage))
  );

// Remove command
program
  .command("remove <flag-name>")
  .alias("rm")
  .description("Remove a feature flag")
  .option("-f, --force", "Skip confirmation prompt")
  .action(removeCommand);

// Status command
program
  .command("status <flag-name>")
  .description("Check if a flag is enabled for given context")
  .option("-u, --user-id <userId>", "User ID")
  .option("-e, --email <email>", "User email")
  .option("--environment <env>", "Environment")
  .option("-v, --verbose", "Show detailed metadata")
  .action(statusCommand);

// Validate command
program
  .command("validate")
  .description("Validate config file syntax")
  .action(validateCommand);

// Error handling
program.on("command:*", () => {
  console.error(chalk.red("\nInvalid command: %s\n"), program.args.join(" "));
  program.help();
});

// Parse arguments
program.parse();
