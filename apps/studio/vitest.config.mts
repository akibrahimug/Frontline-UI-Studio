import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/e2e/**", // Exclude Playwright E2E tests
    ],
    // CI-specific settings to prevent hanging
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Ensure tests don't run in watch mode
    watch: false,
    // Limit parallelism in CI
    fileParallelism: process.env.CI === "true" ? false : true,
    maxConcurrency: process.env.CI === "true" ? 1 : 5,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/vitest.setup.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@refinery/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@refinery/core": path.resolve(__dirname, "../../packages/core/src"),
      "@refinery/llm": path.resolve(__dirname, "../../packages/llm/src"),
    },
  },
});
