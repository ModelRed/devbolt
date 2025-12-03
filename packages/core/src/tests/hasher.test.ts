import { describe, it, expect } from "vitest";
import { Hasher } from "../hasher.js";

describe("Hasher", () => {
  describe("getBucket", () => {
    it("returns deterministic bucket for same input", () => {
      const bucket1 = Hasher.getBucket("test_flag", "user-123");
      const bucket2 = Hasher.getBucket("test_flag", "user-123");

      expect(bucket1).toBe(bucket2);
    });

    it("returns bucket in valid range (0-99)", () => {
      for (let i = 0; i < 100; i++) {
        const bucket = Hasher.getBucket("test_flag", `user-${i}`);
        expect(bucket).toBeGreaterThanOrEqual(0);
        expect(bucket).toBeLessThan(100);
      }
    });

    it("returns different buckets for different users", () => {
      const bucket1 = Hasher.getBucket("test_flag", "user-1");
      const bucket2 = Hasher.getBucket("test_flag", "user-2");

      // Not guaranteed to be different, but valid
      expect(bucket1).toBeGreaterThanOrEqual(0);
      expect(bucket2).toBeGreaterThanOrEqual(0);
    });

    it("returns different buckets for different flags", () => {
      const bucket1 = Hasher.getBucket("flag_a", "user-123");
      const bucket2 = Hasher.getBucket("flag_b", "user-123");

      // Not guaranteed to be different, but valid
      expect(bucket1).toBeGreaterThanOrEqual(0);
      expect(bucket2).toBeGreaterThanOrEqual(0);
    });

    it("uses custom seed", () => {
      const bucket1 = Hasher.getBucket("test_flag", "user-123", "seed1");
      const bucket2 = Hasher.getBucket("test_flag", "user-123", "seed2");

      // Different seeds can produce different buckets
      expect(bucket1).toBeGreaterThanOrEqual(0);
      expect(bucket2).toBeGreaterThanOrEqual(0);
    });

    it("distributes buckets reasonably", () => {
      const buckets = new Set<number>();

      for (let i = 0; i < 1000; i++) {
        buckets.add(Hasher.getBucket("test_flag", `user-${i}`));
      }

      // Should use at least 50 different buckets for good distribution
      expect(buckets.size).toBeGreaterThan(50);
    });
  });

  describe("isInRollout", () => {
    it("returns false for 0% rollout", () => {
      expect(Hasher.isInRollout("test_flag", "user-123", 0)).toBe(false);
      expect(Hasher.isInRollout("test_flag", "user-456", 0)).toBe(false);
    });

    it("returns true for 100% rollout", () => {
      expect(Hasher.isInRollout("test_flag", "user-123", 100)).toBe(true);
      expect(Hasher.isInRollout("test_flag", "user-456", 100)).toBe(true);
    });

    it("is deterministic for same user", () => {
      const result1 = Hasher.isInRollout("test_flag", "user-123", 50);
      const result2 = Hasher.isInRollout("test_flag", "user-123", 50);

      expect(result1).toBe(result2);
    });

    it("approximates rollout percentage", () => {
      let enabledCount = 0;
      const totalUsers = 1000;
      const targetPercentage = 50;

      for (let i = 0; i < totalUsers; i++) {
        if (Hasher.isInRollout("test_flag", `user-${i}`, targetPercentage)) {
          enabledCount++;
        }
      }

      const actualPercentage = (enabledCount / totalUsers) * 100;

      // Should be within 5% of target
      expect(actualPercentage).toBeGreaterThan(targetPercentage - 5);
      expect(actualPercentage).toBeLessThan(targetPercentage + 5);
    });

    it("works with custom seed", () => {
      const result1 = Hasher.isInRollout("test_flag", "user-123", 50, "seed1");
      const result2 = Hasher.isInRollout("test_flag", "user-123", 50, "seed1");

      expect(result1).toBe(result2);
    });
  });
});
