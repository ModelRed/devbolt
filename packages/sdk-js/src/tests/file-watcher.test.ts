import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FileWatcher } from "../file-watcher.js";
import { NoOpLogger } from "@devbolt/core";
import { writeFileSync } from "fs";
import { createTempDir, cleanupTempDir } from "./setup.js";

describe("FileWatcher", () => {
  let testDir: string;
  let watcher: FileWatcher;
  let changeCallCount: number;

  beforeEach(() => {
    testDir = createTempDir();
    changeCallCount = 0;

    watcher = new FileWatcher(new NoOpLogger(), () => {
      changeCallCount++;
    });
  });

  afterEach(async () => {
    await watcher.stop();
    cleanupTempDir(testDir);
  });

  it("starts watching a file", () => {
    const filePath = `${testDir}/test.yml`;
    writeFileSync(filePath, "test: true");

    watcher.start(filePath);
    expect(watcher.active).toBe(true);
  });

  it("stops watching", async () => {
    const filePath = `${testDir}/test.yml`;
    writeFileSync(filePath, "test: true");

    watcher.start(filePath);
    expect(watcher.active).toBe(true);

    await watcher.stop();
    expect(watcher.active).toBe(false);
  });

  it("does not throw when starting already started watcher", () => {
    const filePath = `${testDir}/test.yml`;
    writeFileSync(filePath, "test: true");

    watcher.start(filePath);
    expect(() => watcher.start(filePath)).not.toThrow();
    expect(watcher.active).toBe(true);
  });
});
