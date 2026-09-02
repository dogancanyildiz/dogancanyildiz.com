import { defineConfig } from "velite";
import { collections, mdx } from "../../velite.config";

// Reuses the real collections, like the other fixture configs, so the
// assertion is about the shipped schema. The content root holds one project
// and one post that set every optional field the audit added (updated,
// coverAlt, draft). No real content file sets them yet, so without this
// fixture those fields are typed but never compiled: a wrong type would only
// surface on the day someone finally used one.
//
// Velite resolves "root" and "output.*" relative to this config file's own
// directory (tests/fixtures), and this fixture writes to its own output
// directory so a test run never touches the real .velite output.
export default defineConfig({
  root: "schema-fields",
  collections,
  mdx,
  output: {
    data: ".velite-schema-fields",
    assets: ".velite-schema-fields/static",
    base: "/static/",
    name: "[name]-[hash:8].[ext]",
    clean: true,
  },
});
