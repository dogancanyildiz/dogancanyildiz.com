import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

describe("contact form live regions", () => {
  const form = read("src/components/sections/contact-form.tsx");

  it("announces the error state assertively", () => {
    expect(form).toContain('role="alert"');
  });

  it("announces the success state politely", () => {
    expect(form).toContain('role="status"');
  });

  it("marks the submit button busy while the request is in flight", () => {
    expect(form).toContain('aria-busy={status === "loading"}');
  });

  it("keeps the honeypot hidden from assistive tech", () => {
    expect(form).toContain('aria-hidden="true"');
    expect(form).toContain("tabIndex={-1}");
  });
});

describe("focus ring", () => {
  const css = read("src/app/globals.css");

  it("uses a solid two pixel ring with a two pixel offset", () => {
    expect(css).toMatch(
      /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--ring\)/
    );
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline-offset:\s*2px/);
  });

  it("dropped the translucent default outline on the universal selector", () => {
    expect(css).not.toContain("outline-ring/50");
  });

  it("ships a skip link utility", () => {
    expect(css).toContain(".skip-link");
  });
});

describe("target size", () => {
  it("gives every icon-only control at least 44 CSS px", () => {
    for (const file of [
      "src/components/layout/mobile-menu.tsx",
      "src/components/layout/theme-toggle.tsx",
      "src/components/layout/footer.tsx",
    ]) {
      expect(read(file), `${file} has no tap-target`).toContain("tap-target");
    }
  });

  it("keeps the tap-target utility at 44px", () => {
    expect(read("src/app/globals.css")).toMatch(
      /\.tap-target\s*\{[^}]*min-h-11[^}]*min-w-11/
    );
  });
});
