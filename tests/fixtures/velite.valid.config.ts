import { defineConfig } from "velite";
import { collections, mdx } from "../../velite.config";

// This fixture reuses the real collections and mdx pipeline from
// velite.config.ts, but writes to its own output directory so a test run
// never deletes or rewrites the real .velite output while other test
// workers may be importing it.
//
// Velite resolves "root" and "output.*" relative to this config file's own
// directory (tests/fixtures), not the process cwd, so "root" has to walk
// back up to the repo root's content/ directory.
export default defineConfig({
  root: "../../content",
  collections,
  mdx,
  output: {
    data: ".velite-valid",
    assets: ".velite-valid/static",
    base: "/static/",
    name: "[name]-[hash:8].[ext]",
    clean: true,
  },
});
