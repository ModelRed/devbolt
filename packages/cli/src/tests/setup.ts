import { afterEach, beforeEach } from "vitest";
import { rmSync, mkdirSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export function createTempDir(): string {
  const dir = join(
    tmpdir(),
    `devbolt-cli-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function cleanupTempDir(dir: string): void {
  try {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
});

afterEach(() => {
  try {
    process.chdir(originalCwd);
  } catch (error) {
    // Ignore
  }
});
