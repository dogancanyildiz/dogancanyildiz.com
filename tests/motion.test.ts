import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = collectSourceFiles(join(process.cwd(), "src")).map((file) => {
  const body = readFileSync(file, "utf8");
  return {
    file,
    // Several of these files carry a docstring explaining why the animation
    // was removed, so the assertions below read the code without comments.
    code: body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, ""),
  };
});

/**
 * The site has no JavaScript animation runtime left. Everything that moves is
 * a CSS transition, which means first paint never depends on a script.
 *
 * The last consumer was the contact page, and it was the worst place for one:
 * LazyMotion fetched its feature bundle from a mount effect, so the form,
 * the contact details and the trust note were all written into the prerendered
 * HTML with opacity:0 and only became visible once that second chunk resolved.
 * A dropped request left the only way to reach the owner invisible, and the
 * single CSS escape hatch was scoped to prefers-reduced-motion.
 */
describe("no animation runtime in the bundle", () => {
  it("imports no motion package anywhere under src", () => {
    const offenders = files
      .filter(({ code }) => /["']motion(\/|["'])|framer-motion/.test(code))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("declares no motion dependency", () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8")
    ) as { dependencies?: Record<string, string> };
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain("motion");
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain("framer-motion");
  });

  it("keeps the retired motion helpers deleted", () => {
    for (const path of [
      "src/lib/motion.ts",
      "src/components/motion-provider.tsx",
    ]) {
      expect(existsSync(join(process.cwd(), path)), path).toBe(false);
    }
  });

  it("ships no element that mounts hidden", () => {
    // An element that renders with opacity:0 stays invisible until some script
    // clears it, which is the failure this suite exists to prevent.
    const offenders = files
      .filter(({ code }) => /initial="hidden"|opacity:\s*0\b/.test(code))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it("ships no scroll triggered reveal", () => {
    expect(
      files
        .filter(({ code }) => code.includes("whileInView"))
        .map((f) => f.file)
    ).toEqual([]);
  });

  it("still honours prefers-reduced-motion in CSS", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/globals.css"),
      "utf8"
    );
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("scroll-behavior: auto");
    // The class only existed to undo the hidden variant on the server render.
    expect(css).not.toContain("motion-item");
  });

  it("keeps the contact page renderable without hydration", () => {
    for (const path of [
      "src/components/sections/contact-form.tsx",
      "src/components/sections/contact-page-content.tsx",
      "src/components/sections/hero.tsx",
      "src/components/sections/skills-strip.tsx",
      "src/components/sections/project-list.tsx",
      "src/components/sections/post-list.tsx",
    ]) {
      const source = readFileSync(join(process.cwd(), path), "utf8");
      expect(source, path).not.toContain("motion/");
    }
  });
});

describe("brand cursor blink", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  it("is a stepped CSS keyframe, roughly one flash per second", () => {
    expect(css).toMatch(
      /\.brand-cursor\s*\{[^}]*animation:\s*brand-cursor 1\.06s step-end infinite/
    );
    expect(css).toContain("@keyframes brand-cursor");
  });

  it("stays lit under prefers-reduced-motion instead of ending dark", () => {
    const reduced = css.slice(
      css.indexOf("@media (prefers-reduced-motion: reduce)")
    );
    expect(reduced).toMatch(/\.brand-cursor\s*\{\s*animation:\s*none;\s*\}/);
  });

  it("is opted into by the header alone", () => {
    const usages = readdirSync(join(process.cwd(), "src"), { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
      .filter((file) =>
        readFileSync(join(process.cwd(), "src", file), "utf8").includes(
          'cursor="blink"'
        )
      );
    expect(usages).toEqual(["components/layout/header.tsx"]);
  });
});

describe("availability pulse", () => {
  const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

  it("is a slow opacity keyframe on the hero status dot", () => {
    expect(css).toMatch(
      /\.status-pulse\s*\{[^}]*animation:\s*status-pulse 1\.6s ease-in-out infinite/
    );
    expect(css).toContain("@keyframes status-pulse");
    const hero = readFileSync(
      join(process.cwd(), "src/components/sections/hero.tsx"),
      "utf8"
    );
    expect(hero).toContain(
      'className="status-pulse size-1.5 rounded-full bg-status-up"'
    );
  });

  it("stays steady under prefers-reduced-motion", () => {
    const reduced = css.slice(
      css.indexOf("@media (prefers-reduced-motion: reduce)")
    );
    expect(reduced).toMatch(/\.status-pulse\s*\{\s*animation:\s*none;\s*\}/);
  });
});
