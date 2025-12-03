import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { stringify } from "yaml";
import type { FlagsConfig, FlagConfig } from "@devbolt/core";
import { ConfigParser, ValidationError } from "@devbolt/core";

export const DEFAULT_CONFIG_PATH = ".devbolt/flags.yml";

/**
 * Manages reading and writing flag configurations
 */
export class ConfigManager {
  constructor(private readonly configPath: string = DEFAULT_CONFIG_PATH) {}

  /**
   * Check if config file exists
   */
  exists(): boolean {
    return existsSync(this.configPath);
  }

  /**
   * Read configuration from file
   */
  read(): FlagsConfig {
    if (!this.exists()) {
      throw new Error(`Config file not found: ${this.configPath}`);
    }

    try {
      return ConfigParser.parseFile(this.configPath);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`Invalid config: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Write configuration to file
   */
  write(config: FlagsConfig): void {
    // Ensure directory exists
    const dir = dirname(this.configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Convert to plain objects for YAML serialization
    const plainConfig: Record<string, any> = {};
    for (const [name, flagConfig] of Object.entries(config)) {
      plainConfig[name] = this.flagConfigToPlainObject(flagConfig);
    }

    const yamlContent = stringify(plainConfig, {
      indent: 2,
      lineWidth: 120,
      sortMapEntries: false,
    });

    writeFileSync(this.configPath, yamlContent, "utf-8");
  }

  /**
   * Convert FlagConfig to plain object for YAML
   */
  private flagConfigToPlainObject(config: FlagConfig): Record<string, any> {
    const obj: Record<string, any> = {
      enabled: config.enabled,
    };

    if (config.description) {
      obj.description = config.description;
    }

    if (config.rollout) {
      obj.rollout = {
        percentage: config.rollout.percentage,
      };
      if (config.rollout.seed) {
        obj.rollout.seed = config.rollout.seed;
      }
    }

    if (config.targeting && config.targeting.length > 0) {
      obj.targeting = config.targeting.map((rule) => {
        const ruleObj: Record<string, any> = {
          attribute: rule.attribute,
          operator: rule.operator,
          enabled: rule.enabled,
        };

        if (rule.value !== undefined) {
          ruleObj.value = rule.value;
        }

        if (rule.values !== undefined) {
          ruleObj.values = rule.values;
        }

        if (rule.description) {
          ruleObj.description = rule.description;
        }

        return ruleObj;
      });
    }

    if (config.environments) {
      obj.environments = config.environments;
    }

    if (config.metadata) {
      obj.metadata = config.metadata;
    }

    return obj;
  }

  /**
   * Set a flag in the configuration
   */
  setFlag(flagName: string, flagConfig: FlagConfig): void {
    const config = this.exists() ? this.read() : {};
    config[flagName] = flagConfig;
    this.write(config);
  }

  /**
   * Update a flag in the configuration
   */
  updateFlag(flagName: string, updates: Partial<FlagConfig>): void {
    const config = this.read();

    if (!config[flagName]) {
      throw new Error(`Flag "${flagName}" not found`);
    }

    config[flagName] = {
      ...config[flagName],
      ...updates,
    };

    this.write(config);
  }

  /**
   * Remove a flag from the configuration
   */
  removeFlag(flagName: string): void {
    const config = this.read();

    if (!config[flagName]) {
      throw new Error(`Flag "${flagName}" not found`);
    }

    delete config[flagName];
    this.write(config);
  }

  /**
   * Get a specific flag
   */
  getFlag(flagName: string): FlagConfig | undefined {
    const config = this.read();
    return config[flagName];
  }

  /**
   * Get all flags
   */
  getAllFlags(): FlagsConfig {
    return this.read();
  }
}
