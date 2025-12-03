/**
 * Core types for DevBolt feature flag system
 */

/**
 * Targeting operators for rule matching
 */
export const TARGETING_OPERATORS = [
  "equals",
  "not_equals",
  "in",
  "not_in",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "greater_than",
  "less_than",
  "greater_than_or_equal",
  "less_than_or_equal",
  "matches_regex",
] as const;

export type TargetingOperator = (typeof TARGETING_OPERATORS)[number];

/**
 * Log levels for the logger interface
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Logger interface for dependency injection
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Rollout configuration for percentage-based flag distribution
 */
export interface RolloutConfig {
  /** Percentage of users to include (0-100) */
  percentage: number;
  /** Optional seed for consistent hashing across deployments */
  seed?: string;
}

/**
 * Targeting rule for conditional flag evaluation
 */
export interface TargetingRule {
  /** Attribute to evaluate */
  attribute: string;
  /** Comparison operator */
  operator: TargetingOperator;
  /** Single value for comparison */
  value?: string | number | boolean;
  /** Multiple values for in/not_in operators */
  values?: Array<string | number | boolean>;
  /** Whether this rule enables or disables the flag */
  enabled: boolean;
  /** Optional description of the rule */
  description?: string;
}

/**
 * Feature flag configuration
 */
export interface FlagConfig {
  /** Whether the flag is globally enabled */
  enabled: boolean;
  /** Human-readable description */
  description?: string;
  /** Gradual rollout settings */
  rollout?: RolloutConfig;
  /** Targeting rules (evaluated in order) */
  targeting?: TargetingRule[];
  /** Environment-specific overrides */
  environments?: Record<string, boolean>;
  /** Custom metadata (not used in evaluation) */
  metadata?: Record<string, unknown>;
}

/**
 * Collection of all feature flags
 */
export interface FlagsConfig {
  [flagName: string]: FlagConfig;
}

/**
 * Context for flag evaluation
 */
export interface EvaluationContext {
  /** Unique user identifier */
  userId?: string;
  /** User email address */
  email?: string;
  /** Current environment */
  environment?: string;
  /** Custom attributes for targeting */
  customAttributes?: Record<string, string | number | boolean>;
  /** Internal: custom hash seed for testing */
  _hashSeed?: string;
}

/**
 * Metadata about a flag evaluation
 */
export interface EvaluationMetadata {
  /** When the evaluation occurred */
  timestamp: number;
  /** Index of matched targeting rule (if any) */
  matchedRule?: number;
  /** User's rollout bucket (0-99) */
  rolloutBucket?: number;
  /** Variant identifier (future: A/B testing) */
  variant?: string;
}

/**
 * Result of a flag evaluation
 */
export interface EvaluationResult {
  /** Name of the flag */
  flagName: string;
  /** Whether the flag is enabled */
  enabled: boolean;
  /** Human-readable reason for the result */
  reason: string;
  /** Evaluation metadata */
  metadata: EvaluationMetadata;
}

/**
 * Options for the flag engine
 */
export interface EngineOptions {
  /** Enable strict validation mode */
  strict?: boolean;
  /** Logger instance */
  logger?: Logger;
  /** Default hash seed for rollouts */
  defaultHashSeed?: string;
}

/**
 * Base error class for DevBolt errors
 */
export class DevBoltError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "DevBoltError";
    Object.setPrototypeOf(this, DevBoltError.prototype);
  }
}

/**
 * Configuration validation error
 */
export class ValidationError extends DevBoltError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message, "VALIDATION_ERROR", { field, value });
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Flag not found error
 */
export class FlagNotFoundError extends DevBoltError {
  constructor(public readonly flagName: string) {
    super(`Flag "${flagName}" not found`, "FLAG_NOT_FOUND", { flagName });
    this.name = "FlagNotFoundError";
    Object.setPrototypeOf(this, FlagNotFoundError.prototype);
  }
}

/**
 * Config parsing error
 */
export class ConfigParseError extends DevBoltError {
  constructor(message: string, cause?: Error) {
    super(message, "CONFIG_PARSE_ERROR", { cause: cause?.message });
    this.name = "ConfigParseError";
    Object.setPrototypeOf(this, ConfigParseError.prototype);
  }
}
