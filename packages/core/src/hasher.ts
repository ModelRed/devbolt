import { createHash } from "crypto";

/**
 * Deterministic hash function for rollout distribution
 */
export class Hasher {
  private static readonly DEFAULT_SEED = "devbolt";

  /**
   * Generate a consistent hash bucket (0-99) for a given identifier
   */
  static getBucket(
    flagName: string,
    identifier: string,
    seed?: string
  ): number {
    const hashInput = `${seed || this.DEFAULT_SEED}:${flagName}:${identifier}`;
    const hash = createHash("sha256").update(hashInput).digest("hex");

    // Convert first 8 hex characters to number
    const hashNumber = parseInt(hash.substring(0, 8), 16);

    // Return bucket 0-99
    return hashNumber % 100;
  }

  /**
   * Check if identifier is in rollout percentage
   */
  static isInRollout(
    flagName: string,
    identifier: string,
    percentage: number,
    seed?: string
  ): boolean {
    if (percentage === 0) return false;
    if (percentage === 100) return true;

    const bucket = this.getBucket(flagName, identifier, seed);
    return bucket < percentage;
  }
}
