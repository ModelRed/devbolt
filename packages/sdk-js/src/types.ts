import type {
  EvaluationContext,
  EvaluationResult,
  FlagsConfig,
  Logger,
  LogLevel,
} from "@devbolt/core";

/**
 * Configuration options for DevBolt client
 */
export interface DevBoltOptions {
  /**
   * Path to the feature flags configuration file
   * @default '.devbolt/flags.yml'
   */
  configPath?: string;

  /**
   * Enable automatic reload when config file changes
   * @default true
   */
  autoReload?: boolean;

  /**
   * Default context merged with every evaluation
   */
  defaultContext?: EvaluationContext;

  /**
   * Logger instance or log level
   */
  logger?: Logger | LogLevel;

  /**
   * Throw errors instead of returning fallback values
   * @default false
   */
  throwOnError?: boolean;

  /**
   * Enable strict mode (stricter validation)
   * @default false
   */
  strict?: boolean;

  /**
   * Fallback values for flags when errors occur
   */
  fallbacks?: Record<string, boolean>;

  /**
   * Custom error handler
   */
  onError?: (error: Error) => void;

  /**
   * Callback when config file is updated
   */
  onConfigUpdate?: (config: FlagsConfig) => void;

  /**
   * Callback when a flag is evaluated (for analytics)
   */
  onFlagEvaluated?: (
    result: EvaluationResult,
    context: EvaluationContext
  ) => void;
}

/**
 * Internal client state
 */
export interface ClientState {
  initialized: boolean;
  configPath: string;
  lastLoadTime: number;
  errorCount: number;
}
