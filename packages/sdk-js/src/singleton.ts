import type { EvaluationContext, EvaluationResult } from "@devbolt/core";
import { DevBoltClient } from "./client.js";
import type { DevBoltOptions } from "./types.js";

/**
 * Singleton instance for convenience
 */
let defaultInstance: DevBoltClient | null = null;

/**
 * Initialize DevBolt with options
 */
export function initialize(options?: DevBoltOptions): DevBoltClient {
  if (defaultInstance) {
    // Clean up existing instance
    defaultInstance.destroy().catch(() => {
      // Ignore errors during cleanup
    });
  }

  defaultInstance = new DevBoltClient(options);
  return defaultInstance;
}

/**
 * Check if a flag is enabled (uses singleton)
 */
export function isEnabled(
  flagName: string,
  context?: EvaluationContext
): boolean {
  if (!defaultInstance) {
    throw new Error("DevBolt not initialized. Call initialize() first.");
  }
  return defaultInstance.isEnabled(flagName, context);
}

/**
 * Evaluate a flag (uses singleton)
 */
export function evaluate(
  flagName: string,
  context?: EvaluationContext
): EvaluationResult {
  if (!defaultInstance) {
    throw new Error("DevBolt not initialized. Call initialize() first.");
  }
  return defaultInstance.evaluate(flagName, context);
}

/**
 * Get singleton instance
 */
export function getInstance(): DevBoltClient {
  if (!defaultInstance) {
    throw new Error("DevBolt not initialized. Call initialize() first.");
  }
  return defaultInstance;
}

/**
 * Destroy singleton instance
 */
export async function destroy(): Promise<void> {
  if (defaultInstance) {
    await defaultInstance.destroy();
    defaultInstance = null;
  }
}

/**
 * Check if singleton is initialized
 */
export function isInitialized(): boolean {
  return defaultInstance !== null && defaultInstance.isInitialized();
}
