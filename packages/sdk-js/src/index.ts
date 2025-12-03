// Re-export core types
export type {
  Logger,
  RolloutConfig,
  TargetingRule,
  TargetingOperator,
  FlagConfig,
  FlagsConfig,
  EvaluationContext,
  EvaluationResult,
  EvaluationMetadata,
} from "@devbolt/core";

export { LogLevel, TARGETING_OPERATORS } from "@devbolt/core";

// SDK types
export type { DevBoltOptions, ClientState } from "./types.js";

// Main client
export { DevBoltClient } from "./client.js";

// Singleton functions
export {
  initialize,
  isEnabled,
  evaluate,
  getInstance,
  destroy,
  isInitialized,
} from "./singleton.js";

// Errors
export {
  DevBoltError,
  ValidationError,
  FlagNotFoundError,
  ConfigParseError,
} from "@devbolt/core";
