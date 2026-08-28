import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16.3.3 ships these as warnings (or, for
// react/jsx-no-target-blank, off). Verified in
// node_modules/eslint-config-next/dist/index.js. `npm run lint` runs with
// --max-warnings=0, so a warning already fails CI; raising them to error keeps
// the severity honest and makes the intent explicit if that flag ever moves.
const nextDefaultsRaisedToError = {
  "react/jsx-no-target-blank": "error",
  "jsx-a11y/alt-text": ["error", { elements: ["img"], img: ["Image"] }],
  "jsx-a11y/aria-props": "error",
  "jsx-a11y/aria-proptypes": "error",
  "jsx-a11y/aria-unsupported-elements": "error",
  "jsx-a11y/role-has-required-aria-props": "error",
  "jsx-a11y/role-supports-aria-props": "error",
  "@typescript-eslint/no-unused-vars": "error",
  "@typescript-eslint/no-unused-expressions": "error",
  "import/no-anonymous-default-export": "error",
};

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
    "tests/fixtures/.velite-invalid-links/**",
    "tests/fixtures/.velite-schema-fields/**",
    // Local Claude Code state, including agent worktrees that carry their own
    // node_modules and .next output:
    ".claude/**",
  ]),
  {
    name: "portfolio/severity",
    rules: nextDefaultsRaisedToError,
  },
  {
    // Type-aware linting. Restricted to the TypeScript extensions tsconfig.json
    // actually covers: the .mjs config files and scripts/*.mjs carry no type
    // information, and projectService would fail to place them in a program.
    name: "portfolio/type-aware",
    files: ["**/*.{mts,ts,cts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
    },
  },
]);

export default eslintConfig;
