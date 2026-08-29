// Runs before every test file, jsdom or node alike. Requiring these two
// modules under the plain "node" environment is harmless: jest-dom only
// registers expect matchers, and @testing-library/react's own module body
// only touches `document` inside functions the node-environment specs never
// call.
import "@testing-library/jest-dom/vitest";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// @testing-library/react auto-registers this itself, but only when it finds
// a global `afterEach` (see node_modules/@testing-library/react/dist/index.js).
// This project runs Vitest without `test.globals`, so describe/it/expect are
// explicit imports and no such global exists: cleanup has to be wired by
// hand, or one render test's markup would still be mounted when the next
// jsdom test file's assertions run.
afterEach(() => {
  cleanup();
});
