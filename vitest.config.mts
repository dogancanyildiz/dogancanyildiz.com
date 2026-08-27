import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "#site/content": fileURLToPath(new URL("./.velite", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    watch: false,
    env: {
      NEXT_PUBLIC_SITE_URL: "https://dogancanyildiz.sh",
    },
    server: {
      deps: {
        // next-intl's navigation entry imports next/navigation without a file
        // extension. Node's ESM resolver rejects that for an externalized
        // dependency, so let Vite transform the package instead.
        inline: ["next-intl"],
      },
    },
  },
});
