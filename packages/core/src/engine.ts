import type {
  FlagsConfig,
  EvaluationContext,
  EvaluationResult,
  EngineOptions,
  Logger,
} from "./types.js";
import { FlagNotFoundError } from "./types.js";
import { ConfigParser } from "./parser.js";
import { FlagEvaluator } from "./evaluator.js";
import { NoOpLogger } from "./logger.js";

/**
 * Main engine for feature flag evaluation
 */
export class FlagEngine {
  private config: FlagsConfig;
  private readonly evaluator: FlagEvaluator;
  private readonly logger: Logger;
  private readonly strict: boolean;

  constructor(config: FlagsConfig, options: EngineOptions = {}) {
    this.config = config;
    this.logger = options.logger || new NoOpLogger();
    this.strict = options.strict ?? false;
    this.evaluator = new FlagEvaluator(this.logger);

    this.logger.info("FlagEngine initialized", {
      flagCount: Object.keys(config).length,
      strict: this.strict,
    });
  }

  /**
   * Create engine from YAML string
   */
  static fromYAML(yaml: string, options?: EngineOptions): FlagEngine {
    const config = ConfigParser.parseYAML(yaml);
    return new FlagEngine(config, options);
  }

  /**
   * Create engine from file
   */
  static fromFile(filePath: string, options?: EngineOptions): FlagEngine {
    const config = ConfigParser.parseFile(filePath);
    return new FlagEngine(config, options);
  }

  /**
   * Evaluate a feature flag
   */
  evaluate(
    flagName: string,
    context: EvaluationContext = {}
  ): EvaluationResult {
    const flagConfig = this.config[flagName];

    if (!flagConfig) {
      if (this.strict) {
        throw new FlagNotFoundError(flagName);
      }

      this.logger.warn(`Flag "${flagName}" not found, returning disabled`);
      return {
        flagName,
        enabled: false,
        reason: "Flag not found",
        metadata: { timestamp: Date.now() },
      };
    }

    return this.evaluator.evaluate(flagName, flagConfig, context);
  }

  /**
   * Check if a flag is enabled
   */
  isEnabled(flagName: string, context: EvaluationContext = {}): boolean {
    return this.evaluate(flagName, context).enabled;
  }

  /**
   * Get all flag names
   */
  getAllFlags(): string[] {
    return Object.keys(this.config);
  }

  /**
   * Get flag configuration
   */
  getFlagConfig(flagName: string) {
    return this.config[flagName];
  }

  /**
   * Get entire configuration
   */
  getConfig(): Readonly<FlagsConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Update configuration (for hot reloading)
   */
  updateConfig(config: FlagsConfig): void {
    this.config = config;
    this.logger.info("Configuration updated", {
      flagCount: Object.keys(config).length,
    });
  }
}
