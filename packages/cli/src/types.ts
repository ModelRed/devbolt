/**
 * Type definitions for CLI
 */

export interface CommandOptions {
  [key: string]: unknown;
}

export interface CreateOptions {
  enabled?: boolean;
  description?: string;
  rollout?: number;
  environment?: string;
  yes?: boolean;
}

export interface RolloutOptions {
  environment?: string;
}

export interface RemoveOptions {
  force?: boolean;
}

export interface StatusOptions {
  userId?: string;
  email?: string;
  environment?: string;
  verbose?: boolean;
}

export interface ToggleOptions {
  environment?: string;
}

export interface ListOptions {
  environment?: string;
  format?: "table" | "json" | "yaml";
}
