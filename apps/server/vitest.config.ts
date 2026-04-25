import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@sudoku/domain": path.resolve(__dirname, "../../packages/domain/dist/index.js"),
      "@sudoku/contracts": path.resolve(__dirname, "../../packages/contracts/dist/index.js")
    }
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test-setup.ts"],
    env: {
      DB_PATH: ":memory:"
    }
  }
});
