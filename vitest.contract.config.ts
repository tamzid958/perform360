import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/contract/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    sequence: {
      concurrent: false,
    },
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
