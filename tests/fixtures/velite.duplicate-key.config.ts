import { defineConfig } from "velite";
import { collections, mdx, prepareContent } from "../../velite.config";

// Reuses the real collections and prepare-time invariants, like the other
// fixture configs, so the assertion is about the shipped schema rather than a
// copy of it.
//
// The content root packs three of the four new prepare() rules into one run:
// two posts sharing one translationKey in the same locale (duplicate key),
// one project whose legacySlugs shadows a sibling's live slug (conflict), and
// one project whose legacySlugs lists its own current slug (self reference).
// prepare() collects every violation before throwing, so a single build run
// surfaces all three messages at once instead of needing three fixture roots.
//
// Velite resolves "root" and "output.*" relative to this config file's own
// directory (tests/fixtures), and this fixture writes to its own output
// directory so a test run never touches the real .velite output.
export default defineConfig({
  root: "duplicate-key-content",
  collections,
  mdx,
  prepare: prepareContent,
  output: {
    data: ".velite-duplicate-key",
    assets: ".velite-duplicate-key/static",
    base: "/static/",
    name: "[name]-[hash:8].[ext]",
    clean: true,
  },
});
