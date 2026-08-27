import { defineCollection, defineConfig, s } from "velite";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const projects = defineCollection({
  name: "InvalidProject",
  pattern: "projects/**/*.mdx",
  schema: s.object({
    title: s.string().min(1).max(120),
    slug: s.string().regex(SLUG_PATTERN),
    summary: s.string().min(1).max(300),
    role: s.string().min(1).max(120),
    stack: s.array(s.string().min(1)).min(1),
    year: s.number().int().min(2015).max(2100),
    outcome: s.string().min(1).max(300),
  }),
});

// Velite resolves "root" and "output.*" relative to this config file's own
// directory (tests/fixtures), not the process cwd, so these paths stay
// inside tests/fixtures instead of repeating the "tests/fixtures" segment.
export default defineConfig({
  root: "invalid-content",
  output: {
    data: ".velite-invalid",
    assets: ".velite-invalid/static",
    base: "/static/",
    name: "[name]-[hash:8].[ext]",
    clean: true,
  },
  collections: { projects },
});
