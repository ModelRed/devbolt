import chalk from "chalk";
import Table from "cli-table3";
import type { FlagsConfig, FlagConfig } from "@devbolt/core";
import { stringify } from "yaml";

/**
 * Display utilities for CLI output
 */

export function displaySuccess(message: string): void {
  console.log(chalk.green("✓") + " " + message);
}

export function displayError(message: string): void {
  console.error(chalk.red("✗") + " " + message);
}

export function displayWarning(message: string): void {
  console.warn(chalk.yellow("⚠") + " " + message);
}

export function displayInfo(message: string): void {
  console.log(chalk.blue("ℹ") + " " + message);
}

export function displayFlagTable(flags: FlagsConfig): void {
  if (Object.keys(flags).length === 0) {
    displayInfo("No flags found");
    return;
  }

  const table = new Table({
    head: [
      chalk.bold("Flag Name"),
      chalk.bold("Enabled"),
      chalk.bold("Rollout"),
      chalk.bold("Targeting"),
      chalk.bold("Environments"),
    ],
    style: {
      head: ["cyan"],
    },
  });

  for (const [name, config] of Object.entries(flags)) {
    const enabled = config.enabled ? chalk.green("Yes") : chalk.red("No");

    const rollout = config.rollout ? `${config.rollout.percentage}%` : "-";

    const targeting = config.targeting
      ? `${config.targeting.length} rule(s)`
      : "-";

    const environments = config.environments
      ? Object.keys(config.environments).join(", ")
      : "-";

    table.push([name, enabled, rollout, targeting, environments]);
  }

  console.log(table.toString());
}

export function displayFlagDetail(name: string, config: FlagConfig): void {
  console.log("\n" + chalk.bold.underline(name));
  console.log(chalk.gray("─".repeat(60)));

  console.log(
    chalk.bold("Enabled:"),
    config.enabled ? chalk.green("Yes") : chalk.red("No")
  );

  if (config.description) {
    console.log(chalk.bold("Description:"), config.description);
  }

  if (config.rollout) {
    console.log(chalk.bold("Rollout:"), `${config.rollout.percentage}%`);
    if (config.rollout.seed) {
      console.log(chalk.bold("Rollout Seed:"), config.rollout.seed);
    }
  }

  if (config.environments) {
    console.log(chalk.bold("\nEnvironments:"));
    for (const [env, enabled] of Object.entries(config.environments)) {
      const status = enabled ? chalk.green("enabled") : chalk.red("disabled");
      console.log(`  ${chalk.cyan(env)}: ${status}`);
    }
  }

  if (config.targeting && config.targeting.length > 0) {
    console.log(chalk.bold("\nTargeting Rules:"));
    config.targeting.forEach((rule, index) => {
      const status = rule.enabled
        ? chalk.green("enable")
        : chalk.red("disable");
      const value =
        rule.value !== undefined ? rule.value : rule.values?.join(", ");
      console.log(
        `  ${chalk.cyan(`${index + 1}.`)} ${rule.attribute} ${chalk.yellow(rule.operator)} ${value} → ${status}`
      );
      if (rule.description) {
        console.log(`     ${chalk.gray(rule.description)}`);
      }
    });
  }

  if (config.metadata) {
    console.log(chalk.bold("\nMetadata:"));
    console.log(chalk.gray(stringify(config.metadata, { indent: 2 })));
  }

  console.log();
}

export function displayJson(data: any): void {
  console.log(JSON.stringify(data, null, 2));
}

export function displayYaml(data: any): void {
  console.log(stringify(data, { indent: 2 }));
}
