import { watch, type FSWatcher } from "chokidar";
import type { Logger } from "@devbolt/core";

/**
 * Watches config file for changes
 */
export class FileWatcher {
  private watcher: FSWatcher | undefined;
  private isWatching = false;

  constructor(
    private readonly logger: Logger,
    private readonly onFileChange: () => void
  ) {}

  /**
   * Start watching file
   */
  start(filePath: string): void {
    if (this.isWatching) {
      this.logger.warn("File watcher already started");
      return;
    }

    try {
      this.watcher = watch(filePath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      });

      this.watcher.on("change", (path) => {
        this.logger.info(`Config file changed: ${path}`);
        this.onFileChange();
      });

      this.watcher.on("error", (error) => {
        this.logger.error("File watcher error", { error });
      });

      this.isWatching = true;
      this.logger.debug("File watcher started", { path: filePath });
    } catch (error) {
      this.logger.error("Failed to start file watcher", { error });
      throw error;
    }
  }

  /**
   * Stop watching file
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
      this.isWatching = false;
      this.logger.debug("File watcher stopped");
    }
  }

  /**
   * Check if watcher is active
   */
  get active(): boolean {
    return this.isWatching;
  }
}
