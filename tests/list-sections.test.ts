import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const PROJECT_LIST = "src/components/sections/project-list.tsx";
const POST_LIST = "src/components/sections/post-list.tsx";

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
});

describe("list row classes", () => {
  it("leaves the row geometry to content-entry alone", () => {
    for (const path of [PROJECT_LIST, POST_LIST]) {
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
