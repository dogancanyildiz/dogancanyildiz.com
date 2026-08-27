import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PLAN = "docs/plans/2026-08-27-faz-3-tasarim-sistemi.md";

const repoPath = (relative: string) => join(process.cwd(), relative);
const read = (relative: string) => readFileSync(repoPath(relative), "utf8");

function section(
  doc: string,
  startHeading: string,
  endHeading: string
): string {
  const start = doc.indexOf(startHeading);
  const end = doc.indexOf(endHeading, start);
  expect(start, `heading not found: ${startHeading}`).toBeGreaterThanOrEqual(0);
  expect(end, `heading not found: ${endHeading}`).toBeGreaterThan(start);
  return doc.slice(start, end);
}

describe("faz-3 plan matches the interfaces it actually inherits from faz-2", () => {
  const plan = read(PLAN);

  // Task 0's charter (plan line ~35) is to verify every inherited interface
  // with ls/grep before the branch does real work. These two checks lock the
  // two corrections that verification found, so a future edit to the plan
  // cannot silently reintroduce either mistake.

  describe("OpenGraph image route", () => {
    // The real route lives under [lang] and reads its id, size and content
    // type from src/lib/seo/og-image.ts (faz-2 commit 2b10bd7). A root level
    // src/app/opengraph-image.tsx does not exist; if Task 9 targets it, a
    // second, disconnected OG route is born and buildOpenGraph keeps pointing
    // at the real one.
    it("does not exist at the repo root", () => {
      expect(existsSync(repoPath("src/app/opengraph-image.tsx"))).toBe(false);
    });

    it("exists under the [lang] segment", () => {
      expect(existsSync(repoPath("src/app/[lang]/opengraph-image.tsx"))).toBe(
        true
      );
    });

    it("the plan never asks to modify the non-existent root file", () => {
      expect(plan).not.toMatch(/Modify:\s*`src\/app\/opengraph-image\.tsx`/);
    });

    const task9 = section(
      plan,
      "### Task 9: opengraph-image ve icon route'larını gerçek kimlikle yeniden yaz",
      "### Task 10:"
    );

    it("Task 9 targets the [lang] route in its Files list and Step 1", () => {
      expect(task9).toMatch(
        /Modify:\s*`src\/app\/\[lang\]\/opengraph-image\.tsx`/
      );
      expect(task9).toContain(
        "`src/app/[lang]/opengraph-image.tsx` dosyasının tamamını"
      );
    });

    it("Task 9 keeps the per-locale image metadata plumbing", () => {
      expect(task9).toContain("generateStaticParams");
      expect(task9).toContain("generateImageMetadata");
      expect(task9).toContain("OG_IMAGE_ID");
      expect(task9).toContain("OG_IMAGE_SIZE");
      expect(task9).toContain("OG_IMAGE_CONTENT_TYPE");
      expect(task9).toContain("hasLocale(routing.locales, lang)");
    });

    it("Task 9 does not turn alt into a fixed export", () => {
      // The plan's own test snippet asserts the absence of this pattern
      // (`not.toMatch(/export const alt =/)`), so match the code shape it
      // would actually take rather than the bare token.
      expect(task9).not.toMatch(/export const alt = "/);
    });

    it("Task 9's test reads the [lang] file, not the root one", () => {
      expect(task9).toContain('read("src/app/[lang]/opengraph-image.tsx")');
      expect(task9).not.toContain('read("src/app/opengraph-image.tsx")');
    });

    it("Task 9's runtime checks hit the id-suffixed, per-locale URLs", () => {
      expect(task9).toContain("http://localhost:3000/opengraph-image/default");
      expect(task9).toContain(
        "http://localhost:3000/tr/opengraph-image/default"
      );
    });

    it("Task 9's commit stages the [lang] file, not the root one", () => {
      expect(task9).toContain('git add "src/app/[lang]/opengraph-image.tsx"');
    });
  });

  describe("global-not-found.tsx coverage", () => {
    // Faz 2's handoff note flags this file as an inherited interface Faz 3
    // must edit alongside [lang]/layout.tsx: it renders its own <html>/<body>
    // and does not inherit anything added to the locale layout.
    it("exists and renders its own body independently of [lang]/layout.tsx", () => {
      const source = read("src/app/global-not-found.tsx");
      expect(source).toContain("<html");
      expect(source).toContain("<body");
    });

    it("is named in the inherited-interfaces table", () => {
      expect(plan).toMatch(/`src\/app\/global-not-found\.tsx`\s*\|/);
    });

    const task2 = section(
      plan,
      "### Task 2: Fontları layout'a ve token yığınına bağla",
      "### Task 3:"
    );

    it("Task 2's Files list and font-wiring step cover global-not-found.tsx", () => {
      expect(task2).toMatch(/Modify:\s*`src\/app\/global-not-found\.tsx`/);
      expect(task2).toContain("fontVariables");
    });

    const task3 = section(
      plan,
      "### Task 3: Token bloklarını nötr palete geçir",
      "### Task 4:"
    );
    const task4 = section(
      plan,
      "### Task 4: Zemin katmanını sadeleştir",
      "### Task 5:"
    );

    it("Task 3 and Task 4 both call out global-not-found.tsx in their Files list", () => {
      expect(task3).toContain("global-not-found.tsx");
      expect(task4).toContain("global-not-found.tsx");
    });
  });
});
