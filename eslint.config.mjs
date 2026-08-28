import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Velite content pipeline output and test fixture output:
    ".velite/**",
    "public/static/**",
    "tests/fixtures/.velite-valid/**",
    "tests/fixtures/.velite-invalid/**",
    "tests/fixtures/.velite-schema-fields/**",
    // Local Claude Code state, including agent worktrees that carry their own
    // node_modules and .next output:
    ".claude/**",
  ]),
]);

export default eslintConfig;
