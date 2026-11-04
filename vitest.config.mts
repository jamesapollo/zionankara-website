import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // `server-only` throws outside a React Server environment; stub it for unit tests.
      "server-only": fileURLToPath(new URL("./lib/erp/test-stubs/server-only.ts", import.meta.url)),
    },
  },
  test: { include: ["lib/**/*.test.ts"] },
});
