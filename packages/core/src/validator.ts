import {
  FlagsConfig,
  FlagConfig,
  ValidationError,
  TARGETING_OPERATORS,
  type TargetingOperator,
} from "./types.js";

/**
 * Maximum allowed values
 */
const MAX_FLAG_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const FLAG_NAME_REGEX = /^[a-z0-9_-]+$/;

/**
 * Validates feature flag configurations
 */
export class ConfigValidator {
  /**
   * Validate entire flags configuration
   */
  static validate(config: unknown): asserts config is FlagsConfig {
    if (typeof config !== "object" || config === null) {
      throw new ValidationError("Config must be an object");
    }

    if (Array.isArray(config)) {
      throw new ValidationError("Config must be an object, not an array");
    }

    const flags = config as Record<string, unknown>;
    const flagNames = Object.keys(flags);

    for (const flagName of flagNames) {
      this.validateFlagName(flagName);
      this.validateFlagConfig(flagName, flags[flagName]);
    }
  }

  /**
   * Validate flag name format
   */
  private static validateFlagName(name: string): void {
    if (typeof name !== "string" || name.length === 0) {
      throw new ValidationError(
        "Flag name must be a non-empty string",
        "flagName",
        name
      );
    }

    if (!FLAG_NAME_REGEX.test(name)) {
      throw new ValidationError(
        `Flag name "${name}" must contain only lowercase letters, numbers, underscores, and hyphens`,
        "flagName",
        name
      );
    }

    if (name.length > MAX_FLAG_NAME_LENGTH) {
      throw new ValidationError(
        `Flag name "${name}" exceeds maximum length of ${MAX_FLAG_NAME_LENGTH}`,
        "flagName",
        name
      );
    }
  }

  /**
   * Validate flag configuration structure
   */
  private static validateFlagConfig(
    flagName: string,
    config: unknown
  ): asserts config is FlagConfig {
    if (typeof config !== "object" || config === null) {
      throw new ValidationError(
        `Flag "${flagName}": config must be an object`,
        flagName,
        config
      );
    }

    const flag = config as Record<string, unknown>;

    // Validate required 'enabled' field
    if (typeof flag.enabled !== "boolean") {
      throw new ValidationError(
        `Flag "${flagName}": 'enabled' must be a boolean`,
        `${flagName}.enabled`,
        flag.enabled
      );
    }

    // Validate optional fields
    if (flag.description !== undefined) {
      this.validateDescription(flagName, flag.description);
    }

    if (flag.rollout !== undefined) {
      this.validateRollout(flagName, flag.rollout);
    }

    if (flag.targeting !== undefined) {
      this.validateTargeting(flagName, flag.targeting);
    }

    if (flag.environments !== undefined) {
      this.validateEnvironments(flagName, flag.environments);
    }

    if (flag.metadata !== undefined) {
      this.validateMetadata(flagName, flag.metadata);
    }
  }

  /**
   * Validate description field
   */
  private static validateDescription(
    flagName: string,
    description: unknown
  ): void {
    if (typeof description !== "string") {
      throw new ValidationError(
        `Flag "${flagName}": description must be a string`,
        `${flagName}.description`,
        description
      );
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new ValidationError(
        `Flag "${flagName}": description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH}`,
        `${flagName}.description`,
        description
      );
    }
  }

  /**
   * Validate rollout configuration
   */
  private static validateRollout(flagName: string, rollout: unknown): void {
    if (typeof rollout !== "object" || rollout === null) {
      throw new ValidationError(
        `Flag "${flagName}": rollout must be an object`,
        `${flagName}.rollout`,
        rollout
      );
    }

    const rolloutConfig = rollout as Record<string, unknown>;

    // Validate percentage
    if (typeof rolloutConfig.percentage !== "number") {
      throw new ValidationError(
        `Flag "${flagName}": rollout.percentage must be a number`,
        `${flagName}.rollout.percentage`,
        rolloutConfig.percentage
      );
    }

    if (!Number.isFinite(rolloutConfig.percentage)) {
      throw new ValidationError(
        `Flag "${flagName}": rollout.percentage must be finite`,
        `${flagName}.rollout.percentage`,
        rolloutConfig.percentage
      );
    }

    if (rolloutConfig.percentage < 0 || rolloutConfig.percentage > 100) {
      throw new ValidationError(
        `Flag "${flagName}": rollout.percentage must be between 0 and 100`,
        `${flagName}.rollout.percentage`,
        rolloutConfig.percentage
      );
    }

    // Validate optional seed
    if (
      rolloutConfig.seed !== undefined &&
      typeof rolloutConfig.seed !== "string"
    ) {
      throw new ValidationError(
        `Flag "${flagName}": rollout.seed must be a string`,
        `${flagName}.rollout.seed`,
        rolloutConfig.seed
      );
    }
  }

  /**
   * Validate targeting rules array
   */
  private static validateTargeting(flagName: string, targeting: unknown): void {
    if (!Array.isArray(targeting)) {
      throw new ValidationError(
        `Flag "${flagName}": targeting must be an array`,
        `${flagName}.targeting`,
        targeting
      );
    }

    targeting.forEach((rule, index) => {
      this.validateTargetingRule(flagName, rule, index);
    });
  }

  /**
   * Validate single targeting rule
   */
  private static validateTargetingRule(
    flagName: string,
    rule: unknown,
    index: number
  ): void {
    if (typeof rule !== "object" || rule === null) {
      throw new ValidationError(
        `Flag "${flagName}": targeting rule ${index} must be an object`,
        `${flagName}.targeting[${index}]`,
        rule
      );
    }

    const targetingRule = rule as Record<string, unknown>;
    const ruleKey = `${flagName}.targeting[${index}]`;

    // Validate attribute
    if (
      typeof targetingRule.attribute !== "string" ||
      targetingRule.attribute.length === 0
    ) {
      throw new ValidationError(
        `Flag "${flagName}": targeting rule ${index} attribute must be a non-empty string`,
        `${ruleKey}.attribute`,
        targetingRule.attribute
      );
    }

    // Validate operator
    if (
      !TARGETING_OPERATORS.includes(targetingRule.operator as TargetingOperator)
    ) {
      throw new ValidationError(
        `Flag "${flagName}": targeting rule ${index} has invalid operator "${targetingRule.operator}"`,
        `${ruleKey}.operator`,
        targetingRule.operator
      );
    }

    const operator = targetingRule.operator as TargetingOperator;

    // Validate value/values based on operator
    if (operator === "in" || operator === "not_in") {
      if (
        !Array.isArray(targetingRule.values) ||
        targetingRule.values.length === 0
      ) {
        throw new ValidationError(
          `Flag "${flagName}": targeting rule ${index} with operator "${operator}" requires non-empty 'values' array`,
          `${ruleKey}.values`,
          targetingRule.values
        );
      }

      // Validate each value in array
      for (const value of targetingRule.values) {
        if (
          typeof value !== "string" &&
          typeof value !== "number" &&
          typeof value !== "boolean"
        ) {
          throw new ValidationError(
            `Flag "${flagName}": targeting rule ${index} values must be string, number, or boolean`,
            `${ruleKey}.values`,
            value
          );
        }
      }
    } else {
      if (targetingRule.value === undefined) {
        throw new ValidationError(
          `Flag "${flagName}": targeting rule ${index} with operator "${operator}" requires 'value' field`,
          `${ruleKey}.value`,
          targetingRule.value
        );
      }

      // Validate value type
      const value = targetingRule.value;
      if (
        typeof value !== "string" &&
        typeof value !== "number" &&
        typeof value !== "boolean"
      ) {
        throw new ValidationError(
          `Flag "${flagName}": targeting rule ${index} value must be string, number, or boolean`,
          `${ruleKey}.value`,
          value
        );
      }
    }

    // Validate enabled field
    if (typeof targetingRule.enabled !== "boolean") {
      throw new ValidationError(
        `Flag "${flagName}": targeting rule ${index} 'enabled' must be a boolean`,
        `${ruleKey}.enabled`,
        targetingRule.enabled
      );
    }

    // Validate regex pattern if operator is matches_regex
    if (operator === "matches_regex") {
      try {
        new RegExp(String(targetingRule.value));
      } catch (error) {
        throw new ValidationError(
          `Flag "${flagName}": targeting rule ${index} has invalid regex pattern`,
          `${ruleKey}.value`,
          targetingRule.value
        );
      }
    }

    // Validate optional description
    if (targetingRule.description !== undefined) {
      if (typeof targetingRule.description !== "string") {
        throw new ValidationError(
          `Flag "${flagName}": targeting rule ${index} description must be a string`,
          `${ruleKey}.description`,
          targetingRule.description
        );
      }
    }
  }

  /**
   * Validate environments configuration
   */
  private static validateEnvironments(
    flagName: string,
    environments: unknown
  ): void {
    if (
      typeof environments !== "object" ||
      environments === null ||
      Array.isArray(environments)
    ) {
      throw new ValidationError(
        `Flag "${flagName}": environments must be an object`,
        `${flagName}.environments`,
        environments
      );
    }

    const envs = environments as Record<string, unknown>;

    for (const [env, enabled] of Object.entries(envs)) {
      if (typeof enabled !== "boolean") {
        throw new ValidationError(
          `Flag "${flagName}": environment "${env}" value must be a boolean`,
          `${flagName}.environments.${env}`,
          enabled
        );
      }
    }
  }

  /**
   * Validate metadata
   */
  private static validateMetadata(flagName: string, metadata: unknown): void {
    if (
      typeof metadata !== "object" ||
      metadata === null ||
      Array.isArray(metadata)
    ) {
      throw new ValidationError(
        `Flag "${flagName}": metadata must be an object`,
        `${flagName}.metadata`,
        metadata
      );
    }
  }
}
