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

describe("focus ring survives on form controls", () => {
  it("never pairs outline-none with focus-visible:outline-2 in src/components/ui", () => {
    const files = [
      "src/components/ui/button.tsx",
      "src/components/ui/input.tsx",
      "src/components/ui/textarea.tsx",
    ];
    for (const file of files) {
      const source = read(file);
      const hasOutlineNone = /\boutline-none\b/.test(source);
      const hasFocusVisibleOutline = source.includes("focus-visible:outline-2");
      expect(
        hasOutlineNone && hasFocusVisibleOutline,
        `${file} pairs outline-none with focus-visible:outline-2, which zeroes out the ring in the same @layer utilities pass`
      ).toBe(false);
    }
  });
});

describe("target size", () => {
  it("gives every icon-only control at least 44 CSS px", () => {
    for (const file of [
      "src/components/layout/mobile-menu.tsx",
      "src/components/layout/theme-toggle.tsx",
      "src/components/layout/footer.tsx",
      "src/components/layout/language-switcher.tsx",
      "src/components/layout/header.tsx",
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

describe("theme toggle reflects the resolved theme", () => {
  const source = read("src/components/layout/theme-toggle.tsx");

  it("reads resolvedTheme instead of the raw (possibly 'system') theme value", () => {
    expect(source).toContain("resolvedTheme");
    expect(source).not.toMatch(/\btheme === "dark"/);
  });

  it("labels the button from the message catalog in both mount states", () => {
    expect(source).not.toContain('aria-label="Toggle theme"');
    expect(
      source.match(/aria-label=\{t\("a11y\.toggleTheme"\)\}/g)
    ).toHaveLength(2);
  });
});

describe("skip link", () => {
  it("keeps its padding once it becomes visible", () => {
    // not-sr-only resets padding to 0 and the :focus-visible rule outranks
    // .skip-link, so the inset has to be restated inside the focus rule.
    expect(read("src/app/globals.css")).toMatch(
      /\.skip-link:focus-visible\s*\{[^}]*padding:\s*0\.5rem 1rem/
    );
  });

  it("targets a main landmark that can actually receive focus", () => {
    expect(read("src/app/[lang]/layout.tsx")).toMatch(
      /<main[^>]*id="main"[^>]*tabIndex=\{-1\}/
    );
  });
});
