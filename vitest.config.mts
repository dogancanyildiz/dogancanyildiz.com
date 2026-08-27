import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "#site/content": fileURLToPath(new URL("./.velite", import.meta.url)),
      // server-only's default export throws unconditionally; only the
      // "react-server" export condition resolves to a no-op, and vitest runs
      // in a plain node environment that never sets that condition. Alias
      // straight to the package's own empty stub so importing a server-only
      // module (mdx-content.tsx) in tests behaves like it does inside Next's
      // server component graph.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url)
      ),
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
