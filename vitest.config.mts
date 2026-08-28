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
    // Base environment stays "node": most test files are source/behaviour
    // checks that never touch the DOM, and jsdom setup cost is not free.
    // Files that render components opt into jsdom individually with a
    // "// @vitest-environment jsdom" comment on their first line (Vitest 4
    // dropped environmentMatchGlobs; per-file overrides are the replacement
    // for a single project, see node_modules/vitest/dist/chunks/config.*.d.ts).
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
    ],
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    watch: false,
    env: {
      NEXT_PUBLIC_SITE_URL: "https://dogancanyildiz.com",
    },
    server: {
      deps: {
        // next-intl's navigation entry imports next/navigation without a file
        // extension. Node's ESM resolver rejects that for an externalized
        // dependency, so let Vite transform the package instead.
        inline: ["next-intl"],
      },
    },
    // Every test file starts from the same clean slate instead of whatever a
    // previous file left behind: a stray vi.stubEnv or vi.spyOn used to only
    // fail depending on run order.
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      // Set a little below the measured baseline (see docs/plans/handoffs or
      // `npm run test -- --coverage` for the current numbers), so the gate
      // catches a real regression without chasing 100% on files nobody has
      // reached to test yet.
      // Raised alongside the jsdom render tests added for the contact form,
      // mobile menu, theme toggle, language switcher, about subnav list,
      // systems panel, error boundary, umami script and brand/skill icons
      // (measured baseline: ~77% statements, ~72% branches, ~69% functions,
      // ~79% lines; see `npm run test -- --coverage` for the current numbers).
      thresholds: {
        lines: 76,
        statements: 74,
        functions: 65,
        branches: 68,
      },
    },
  },
});
