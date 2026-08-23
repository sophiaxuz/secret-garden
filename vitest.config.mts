// Vitest provides the test runner while Vite transforms TypeScript and JSX.
import { defineConfig } from "vitest/config";
// Node's URL helper turns this configuration file's URL into a filesystem path.
import { fileURLToPath } from "node:url";

// Export the settings Vitest reads whenever the test commands run.
export default defineConfig({
  // Next.js uses the modern JSX transform without requiring a React import.
  esbuild: {
    jsx: "automatic",
  },
  // Match the `@/` imports used throughout the Next.js application.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  // Give component tests browser-like DOM APIs and shared matchers.
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    restoreMocks: true,
  },
});
