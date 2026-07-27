import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Most suites are pure logic and run in `node`; component suites opt into
// jsdom with a `@vitest-environment jsdom` docblock. The alias mirrors the
// `@/*` path in tsconfig.json so components resolve their own imports.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
