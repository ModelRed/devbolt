import type {
  FlagConfig,
  EvaluationContext,
  EvaluationResult,
  TargetingRule,
  Logger,
} from "./types.js";
import { Hasher } from "./hasher.js";
import { NoOpLogger } from "./logger.js";

/**
 * Evaluates feature flags based on configuration and context
 */
export class FlagEvaluator {
  private readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new NoOpLogger();
  }

  /**
   * Evaluate a feature flag
   */
  evaluate(
    flagName: string,
    config: FlagConfig,
    context: EvaluationContext
  ): EvaluationResult {
    const startTime = Date.now();
    this.logger.debug(`Evaluating flag "${flagName}"`, { context });

    // Priority 1: Environment override
    const envResult = this.evaluateEnvironment(flagName, config, context);
    if (envResult) {
      return this.createResult(
        flagName,
        envResult.enabled,
        envResult.reason,
        startTime
      );
    }

    // Priority 2: Global disabled
    if (!config.enabled) {
      return this.createResult(
        flagName,
        false,
        "Flag is disabled globally",
        startTime
      );
    }

    // Priority 3: Targeting rules
    const targetingResult = this.evaluateTargeting(flagName, config, context);
    if (targetingResult) {
      return this.createResult(
        flagName,
        targetingResult.enabled,
        targetingResult.reason,
        startTime,
        { matchedRule: targetingResult.ruleIndex }
      );
    }

    // Priority 4: Rollout percentage
    const rolloutResult = this.evaluateRollout(flagName, config, context);
    if (rolloutResult) {
      return this.createResult(
        flagName,
        rolloutResult.enabled,
        rolloutResult.reason,
        startTime,
        { rolloutBucket: rolloutResult.bucket }
      );
    }

    // Default: enabled for all
    return this.createResult(
      flagName,
      true,
      "Flag is enabled for all users",
      startTime
    );
  }

  /**
   * Evaluate environment-specific override
   */
  private evaluateEnvironment(
    flagName: string,
    config: FlagConfig,
    context: EvaluationContext
  ): { enabled: boolean; reason: string } | null {
    if (!config.environments || !context.environment) {
      return null;
    }

    const envEnabled = config.environments[context.environment];
    if (envEnabled === undefined) {
      return null;
    }

    this.logger.debug(
      `Flag "${flagName}" environment override: ${context.environment} = ${envEnabled}`
    );

    return {
      enabled: envEnabled,
      reason: `Environment override: ${context.environment}`,
    };
  }

  /**
   * Evaluate targeting rules
   */
  private evaluateTargeting(
    flagName: string,
    config: FlagConfig,
    context: EvaluationContext
  ): { enabled: boolean; reason: string; ruleIndex: number } | null {
    if (!config.targeting || config.targeting.length === 0) {
      return null;
    }

    for (const [i, rule] of config.targeting.entries()) {
      if (this.ruleMatches(rule, context)) {
        this.logger.debug(
          `Flag "${flagName}" matched targeting rule #${i + 1}`,
          { rule }
        );

        return {
          enabled: rule.enabled,
          reason: `Matched targeting rule #${i + 1}${rule.description ? `: ${rule.description}` : ""}`,
          ruleIndex: i,
        };
      }
    }

    return null;
  }

  /**
   * Check if a targeting rule matches the context
   */
  private ruleMatches(
    rule: TargetingRule,
    context: EvaluationContext
  ): boolean {
    const attributeValue = this.getAttributeValue(rule.attribute, context);

    // If attribute doesn't exist, rule doesn't match
    if (attributeValue === undefined || attributeValue === null) {
      return false;
    }

    try {
      switch (rule.operator) {
        case "equals":
          return attributeValue === rule.value;

        case "not_equals":
          return attributeValue !== rule.value;

        case "in":
          return rule.values?.includes(attributeValue) ?? false;

        case "not_in":
          return !(rule.values?.includes(attributeValue) ?? true);

        case "contains":
          return String(attributeValue)
            .toLowerCase()
            .includes(String(rule.value).toLowerCase());

        case "not_contains":
          return !String(attributeValue)
            .toLowerCase()
            .includes(String(rule.value).toLowerCase());

        case "starts_with":
          return String(attributeValue)
            .toLowerCase()
            .startsWith(String(rule.value).toLowerCase());

        case "ends_with":
          return String(attributeValue)
            .toLowerCase()
            .endsWith(String(rule.value).toLowerCase());

        case "greater_than":
          return Number(attributeValue) > Number(rule.value);

        case "less_than":
          return Number(attributeValue) < Number(rule.value);

        case "greater_than_or_equal":
          return Number(attributeValue) >= Number(rule.value);

        case "less_than_or_equal":
          return Number(attributeValue) <= Number(rule.value);

        case "matches_regex": {
          const regex = new RegExp(String(rule.value));
          return regex.test(String(attributeValue));
        }

        default:
          this.logger.warn(`Unknown operator: ${rule.operator}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Error evaluating rule`, { rule, error });
      return false;
    }
  }

  /**
   * Get attribute value from context
   */
  private getAttributeValue(
    attribute: string,
    context: EvaluationContext
  ): string | number | boolean | undefined {
    // Check standard fields
    if (attribute === "userId") return context.userId;
    if (attribute === "email") return context.email;
    if (attribute === "environment") return context.environment;

    // Check custom attributes
    return context.customAttributes?.[attribute];
  }

  /**
   * Evaluate rollout percentage
   */
  private evaluateRollout(
    flagName: string,
    config: FlagConfig,
    context: EvaluationContext
  ): { enabled: boolean; reason: string; bucket: number } | null {
    if (!config.rollout) {
      return null;
    }

    const identifier = context.userId || context.email || "anonymous";
    const seed = config.rollout.seed || context._hashSeed;
    const bucket = Hasher.getBucket(flagName, identifier, seed);
    const inRollout = bucket < config.rollout.percentage;

    this.logger.debug(`Flag "${flagName}" rollout evaluation`, {
      percentage: config.rollout.percentage,
      bucket,
      inRollout,
    });

    return {
      enabled: inRollout,
      reason: `Rollout ${config.rollout.percentage}% (user bucket: ${bucket})`,
      bucket,
    };
  }

  /**
   * Create evaluation result
   */
  private createResult(
    flagName: string,
    enabled: boolean,
    reason: string,
    startTime: number,
    additionalMetadata?: Record<string, unknown>
  ): EvaluationResult {
    const result: EvaluationResult = {
      flagName,
      enabled,
      reason,
      metadata: {
        timestamp: startTime,
        ...additionalMetadata,
      },
    };

    this.logger.debug(`Flag "${flagName}" evaluation complete`, {
      enabled,
      reason,
      duration: Date.now() - startTime,
    });

    return result;
  }
}
