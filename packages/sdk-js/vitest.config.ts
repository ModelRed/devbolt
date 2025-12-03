import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.config.{js,ts}",
        "**/*.d.ts",
        "**/index.ts",
        "**/__tests__/**",
      ],
    },
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@devbolt/core": resolve(__dirname, "../core/src"),
    },
  },
});
