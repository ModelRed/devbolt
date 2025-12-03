import type {
  EvaluationContext,
  EvaluationResult,
  FlagsConfig,
  Logger,
} from "@devbolt/core";
import {
  FlagEngine,
  FlagNotFoundError,
  LogLevel,
  createLogger,
} from "@devbolt/core";
import type { DevBoltOptions, ClientState } from "./types.js";
import { ConfigLoader } from "./config-loader.js";
import { FileWatcher } from "./file-watcher.js";

/**
 * DevBolt SDK client for feature flag evaluation
 */
export class DevBoltClient {
  private engine: FlagEngine | null = null;
  private readonly logger: Logger;
  private readonly configLoader: ConfigLoader;
  private fileWatcher: FileWatcher | undefined;
  private state: ClientState;

  // Options
  private readonly configPath: string = "";
  private readonly autoReload: boolean;
  private readonly defaultContext: EvaluationContext;
  private readonly throwOnError: boolean;
  private readonly strict: boolean;
  private readonly fallbacks: Record<string, boolean>;
  private readonly onError: (error: Error) => void;
  private readonly onConfigUpdate: (config: FlagsConfig) => void;
  private readonly onFlagEvaluated: (
    result: EvaluationResult,
    context: EvaluationContext
  ) => void;

  constructor(options: DevBoltOptions = {}) {
    // Initialize logger
    this.logger = this.createLogger(options.logger);
    this.configLoader = new ConfigLoader(this.logger);

    // Setup options
    this.autoReload = options.autoReload ?? true;
    this.defaultContext = options.defaultContext ?? {};
    this.throwOnError = options.throwOnError ?? false;
    this.strict = options.strict ?? false;
    this.fallbacks = options.fallbacks ?? {};
    this.onError = options.onError ?? this.defaultErrorHandler.bind(this);
    this.onConfigUpdate = options.onConfigUpdate ?? (() => {});
    this.onFlagEvaluated = options.onFlagEvaluated ?? (() => {});

    // Initialize state
    this.state = {
      initialized: false,
      configPath: "",
      lastLoadTime: 0,
      errorCount: 0,
    };

    // Find and load config
    try {
      Object.defineProperty(this, "configPath", {
        value: this.configLoader.findConfigPath(options.configPath),
        writable: false,
      });

      this.state.configPath = this.configPath;
      this.loadConfig();
      this.state.initialized = true;

      // Setup file watcher if auto-reload is enabled
      if (this.autoReload) {
        this.setupFileWatcher();
      }

      this.logger.info("DevBolt client initialized", {
        configPath: this.configPath,
        autoReload: this.autoReload,
        strict: this.strict,
      });
    } catch (error) {
      this.handleError(error as Error);
      if (this.throwOnError) {
        throw error;
      }
    }
  }

  /**
   * Create logger instance
   */
  private createLogger(logger?: Logger | LogLevel): Logger {
    if (!logger) {
      return createLogger(LogLevel.WARN);
    }
    if (typeof logger === "number") {
      return createLogger(logger);
    }
    return logger;
  }

  /**
   * Default error handler
   */
  private defaultErrorHandler(error: Error): void {
    this.logger.error("DevBolt error", { error: error.message });
    this.state.errorCount++;
  }

  /**
   * Load configuration from file
   */
  private loadConfig(): void {
    try {
      const config = this.configLoader.loadConfig(this.configPath);
      this.engine = new FlagEngine(config, {
        logger: this.logger,
        strict: this.strict,
      });
      this.state.lastLoadTime = Date.now();
      this.state.errorCount = 0;
    } catch (error) {
      this.logger.error("Failed to load config", { error });
      throw error;
    }
  }

  /**
   * Setup file watcher for auto-reload
   */
  private setupFileWatcher(): void {
    this.fileWatcher = new FileWatcher(this.logger, () => {
      this.reloadConfig();
    });

    try {
      this.fileWatcher.start(this.configPath);
    } catch (error) {
      this.logger.warn("Failed to setup file watcher, auto-reload disabled", {
        error,
      });
    }
  }

  /**
   * Reload configuration from file
   */
  private reloadConfig(): void {
    try {
      const config = this.configLoader.loadConfig(this.configPath);

      if (this.engine) {
        this.engine.updateConfig(config);
      } else {
        this.engine = new FlagEngine(config, {
          logger: this.logger,
          strict: this.strict,
        });
      }

      this.state.lastLoadTime = Date.now();
      this.state.errorCount = 0;
      this.onConfigUpdate(config);

      this.logger.info("Config reloaded successfully");
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Handle errors based on options
   */
  private handleError(error: Error): void {
    this.onError(error);
    if (this.throwOnError) {
      throw error;
    }
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.state.initialized && this.engine !== null;
  }

  /**
   * Get client state
   */
  getState(): Readonly<ClientState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Evaluate a feature flag
   */
  evaluate(flagName: string, context?: EvaluationContext): EvaluationResult {
    // Check initialization
    if (!this.isInitialized()) {
      const fallback = this.fallbacks[flagName] ?? false;
      return {
        flagName,
        enabled: fallback,
        reason: "Client not initialized, using fallback",
        metadata: { timestamp: Date.now() },
      };
    }

    // Merge contexts
    const mergedContext: EvaluationContext = {
      ...this.defaultContext,
      ...context,
    };

    try {
      const result = this.engine!.evaluate(flagName, mergedContext);

      // Trigger callback (wrapped in try-catch to not break evaluation)
      try {
        this.onFlagEvaluated(result, mergedContext);
      } catch (callbackError) {
        this.logger.error("Error in onFlagEvaluated callback", {
          error: callbackError,
        });
      }

      return result;
    } catch (error) {
      // Handle flag not found
      if (error instanceof FlagNotFoundError) {
        const fallback = this.fallbacks[flagName] ?? false;

        if (!this.strict) {
          this.logger.warn(
            `Flag "${flagName}" not found, using fallback: ${fallback}`
          );
          return {
            flagName,
            enabled: fallback,
            reason: "Flag not found, using fallback",
            metadata: { timestamp: Date.now() },
          };
        }
      }

      this.handleError(error as Error);

      // Return fallback
      const fallback = this.fallbacks[flagName] ?? false;
      return {
        flagName,
        enabled: fallback,
        reason: `Error evaluating flag: ${(error as Error).message}`,
        metadata: { timestamp: Date.now() },
      };
    }
  }

  /**
   * Check if a flag is enabled
   */
  isEnabled(flagName: string, context?: EvaluationContext): boolean {
    return this.evaluate(flagName, context).enabled;
  }

  /**
   * Get all flag names
   */
  getAllFlags(): string[] {
    if (!this.isInitialized()) {
      return [];
    }
    return this.engine!.getAllFlags();
  }

  /**
   * Get flag configuration
   */
  getFlagConfig(flagName: string) {
    if (!this.isInitialized()) {
      return undefined;
    }
    return this.engine!.getFlagConfig(flagName);
  }

  /**
   * Get entire configuration
   */
  getConfig(): FlagsConfig {
    if (!this.isInitialized()) {
      return {};
    }
    return this.engine!.getConfig();
  }

  /**
   * Manually reload configuration
   */
  reload(): void {
    this.logger.info("Manual config reload triggered");
    this.reloadConfig();
  }

  /**
   * Destroy client and cleanup resources
   */
  async destroy(): Promise<void> {
    this.logger.info("Destroying DevBolt client");

    if (this.fileWatcher) {
      await this.fileWatcher.stop();
      this.fileWatcher = undefined;
    }

    this.engine = null;
    this.state.initialized = false;
  }
}
