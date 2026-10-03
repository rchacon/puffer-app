import { defineConfig } from "vitest/config";

// Node by default: the auth/API logic only needs fetch, crypto.subtle and
// URL, all Node globals. The React provider test opts into jsdom with a
// `@vitest-environment jsdom` docblock.
export default defineConfig({
  test: {
    environment: "node",
  },
});
