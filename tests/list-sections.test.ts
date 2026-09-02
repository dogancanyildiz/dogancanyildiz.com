import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const PROJECT_LIST = "src/components/sections/project-list.tsx";
const POST_LIST = "src/components/sections/post-list.tsx";
const EXPERIENCE_SUMMARY = "src/components/sections/experience-summary.tsx";
const HOME = "src/app/[lang]/page.tsx";

describe("project card badge links", () => {
  it("clears the 24px target floor WCAG 2.2 SC 2.5.8 asks for", () => {
    const source = read(PROJECT_LIST);
    // .tag-pill is px-2.5 py-0.5 on 10px type, about 19px tall on its own.
    const badgeClass = source.match(
      /const BADGE_LINK_CLASS =\s*\n?\s*"([^"]+)"/
    );
    expect(badgeClass, "BADGE_LINK_CLASS is missing").not.toBeNull();
    expect(badgeClass?.[1]).toContain("min-h-6");
    expect(badgeClass?.[1]).toContain("inline-flex");
  });

  it("uses the shared badge class for both the live and the source link", () => {
    const source = read(PROJECT_LIST);
    expect(source.match(/className=\{BADGE_LINK_CLASS\}/g)).toHaveLength(2);
  });

  it("keeps the badges above the stretched card link", () => {
    // The title link covers the whole row with after:absolute after:inset-0.
    // Statically positioned siblings paint and hit-test under that layer, so
    // the badge row has to open its own stacking context or the 24px target
    // this suite guards belongs to a link nobody can click.
    const source = read(PROJECT_LIST);
    const badgeRow = /<div className="([^"]*)"[^>]*>\s*\{project\.liveUrl/.exec(
      source
    );
    expect(badgeRow, "badge row wrapper is missing").not.toBeNull();
    expect(badgeRow?.[1]).toContain("relative");
    expect(badgeRow?.[1]).toContain("z-10");
  });
});

describe("project card outcome", () => {
  it("keeps the outcome line on the card, not only on the detail page", () => {
    // The listing copy promises the reader that every card says what changed.
    // Dropping this line from the card leaves that promise on the page with
    // nothing behind it, and every other test here still passes.
    const source = read(PROJECT_LIST);
    expect(source).toContain("{project.outcome}");
    expect(source).toContain(
      '<span className="meta-label">{t("outcome")}</span>'
    );
  });
});

describe("home page section order", () => {
  it("puts the live systems panel after the writing and before the cta", () => {
    // The funnel is: work, experience, capabilities, writing, systems, cta.
    // The panel speaks to engineers, so it earns its screen once the reader
    // has been through the proof, and never in the middle of the page.
    const source = read(HOME);
    const at = (marker: string) => {
      const index = source.indexOf(marker);
      expect(index, `${marker} is missing from ${HOME}`).toBeGreaterThan(-1);
      return index;
    };

    const order = [
      "<Hero ",
      "<ProjectList ",
      "<ExperienceSummary ",
      "<SkillsStrip ",
      "<PostList ",
      "<Systems />",
      "<ContactCta />",
    ].map((marker) => at(marker));

    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("leaves the cv download to the about page", () => {
    expect(read(HOME)).not.toContain("hasCv");
    expect(read("src/components/sections/hero.tsx")).not.toContain("CV_PATH");
  });
});

describe("list row classes", () => {
  it("leaves the row geometry to content-entry alone", () => {
    for (const path of [PROJECT_LIST, POST_LIST, EXPERIENCE_SUMMARY]) {
      const source = read(path);
      expect(source, path).toContain("content-entry");
      // .list-row repeated the same relative/py-5/transition-colors trio.
      expect(source, path).not.toContain("list-row");
    }
  });
});

describe("card link prefetching", () => {
  it("opts card links out of viewport prefetching", () => {
    for (const path of [PROJECT_LIST, POST_LIST]) {
      const source = read(path);
      const links = [...source.matchAll(/<Link\b[^>]*>/g)].map((m) => m[0]);
      expect(links.length, path).toBeGreaterThan(0);
      for (const link of links) {
        expect(link, `${path}: ${link}`).toContain("prefetch={false}");
      }
    }
  });
});

describe("hero metric links", () => {
  it("names each metric link after the label it sits under", () => {
    const source = read("src/components/sections/hero.tsx");
    expect(source).toContain("aria-label={`${metric.label}: ${metric.value}`}");
  });
});
