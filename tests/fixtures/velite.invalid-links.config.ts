import { defineConfig } from "velite";
import { collections, mdx } from "../../velite.config";

// Reuses the real collections so the assertion is about the shipped schema
// rather than a copy of it. The content root holds one project whose
// links.live is a javascript: url: s.string().url() accepts that happily, and
// the value is rendered straight into an href, so the build has to refuse it.
//
// Velite resolves "root" and "output.*" relative to this config file's own
// directory (tests/fixtures), and this fixture writes to its own output
// directory so a test run never touches the real .velite output.
export default defineConfig({
  root: "invalid-links",
  collections,
  mdx,
  output: {
    data: ".velite-invalid-links",
    assets: ".velite-invalid-links/static",
    base: "/static/",
    name: "[name]-[hash:8].[ext]",
    clean: true,
  },
});
