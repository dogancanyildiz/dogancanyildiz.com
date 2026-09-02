import { describe, expect, it } from "vitest";
import { contentHref, pathnameForLocale } from "@/i18n/navigation";
import {
  LEGACY_EN_PREFIXED,
  LEGACY_TR_PREFIXED,
  LEGACY_UNPREFIXED,
  legacyRedirectTarget,
} from "@/i18n/legacy-paths";
import { routing } from "@/i18n/routing";
import { getPosts, getProjects } from "@/lib/content";
import type { ContentKind, Locale } from "@/lib/content";

/** Internal section path of a kind, the shape every legacy key was written in. */
const SECTION: Record<ContentKind, string> = {
  post: "/blog",
  project: "/projects",
};

/** Static internal pathnames that resolve to a real page in every locale. */
const STATIC_PAGES = [
  "/",
  "/about",
  "/projects",
  "/blog",
  "/contact",
  "/privacy",
  "/coming-soon",
  "/updating",
  "/feed.xml",
] as const;

interface Entry {
  locale: Locale;
  kind: ContentKind;
  slug: string;
  legacySlugs: readonly string[];
}

function entries(): Entry[] {
  const all: Entry[] = [];
  for (const locale of routing.locales) {
    for (const post of getPosts(locale)) {
      all.push({
        locale,
        kind: "post",
        slug: post.slug,
        legacySlugs: post.legacySlugs,
      });
    }
    for (const project of getProjects(locale)) {
      all.push({
        locale,
        kind: "project",
        slug: project.slug,
        legacySlugs: project.legacySlugs,
      });
    }
  }
  return all;
}

/** Every address the site actually serves today, both locales. */
function canonicalPaths(): Set<string> {
  const paths = new Set<string>();
  for (const locale of routing.locales) {
    for (const page of STATIC_PAGES) {
      paths.add(pathnameForLocale(locale, page));
    }
  }
  for (const entry of entries()) {
    paths.add(contentHref(entry.locale, entry.kind, entry.slug));
  }
  return paths;
}

describe("legacy path tables", () => {
  it("points every target at an address the site really serves", () => {
    const canonical = canonicalPaths();
    const targets = [
      ...Object.values(LEGACY_UNPREFIXED),
      ...Object.values(LEGACY_EN_PREFIXED),
      ...Object.values(LEGACY_TR_PREFIXED),
    ];

    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(canonical, target).toContain(target);
    }
  });

  it("carries every legacy slug the content declares", () => {
    const withLegacy = entries().filter(
      (entry) => entry.legacySlugs.length > 0
    );
    // Guard against a silent pass if the frontmatter field ever disappears.
    expect(withLegacy.length).toBeGreaterThanOrEqual(5);

    for (const entry of withLegacy) {
      for (const legacy of entry.legacySlugs) {
        const oldInternal = `${SECTION[entry.kind]}/${legacy}`;
        const canonical = contentHref(entry.locale, entry.kind, entry.slug);

        // Unprefixed: the address existed, so the table has to answer for it.
        // Which locale it answers with is the owner's per slug language rule,
        // not something this invariant decides.
        expect(
          Object.keys(LEGACY_UNPREFIXED),
          `${entry.locale} ${oldInternal}`
        ).toContain(oldInternal);

        // Locale prefixed: here the entry's own locale is unambiguous, so the
        // target must be this entry's canonical address.
        if (entry.locale === "en") {
          expect(LEGACY_EN_PREFIXED[`/en${oldInternal}`], oldInternal).toBe(
            canonical
          );
        } else {
          expect(LEGACY_TR_PREFIXED[oldInternal], oldInternal).toBe(canonical);
        }
      }
    }
  });

  it("never keys a table on an address that is canonical today", () => {
    const canonical = canonicalPaths();
    for (const key of [
      ...Object.keys(LEGACY_UNPREFIXED),
      ...Object.keys(LEGACY_EN_PREFIXED),
    ]) {
      expect(canonical, key).not.toContain(key);
    }
    // The /tr table is keyed by the remainder after the prefix is stripped,
    // so its keys are compared with the prefix put back on.
    for (const key of Object.keys(LEGACY_TR_PREFIXED)) {
      expect(canonical, `/tr${key}`).not.toContain(`/tr${key}`);
    }
  });

  it("answers every unprefixed key on the /tr branch as well", () => {
    // Without this, /tr/projects/gpa-calculator would strip to
    // /projects/gpa-calculator, fall into the unprefixed table and land a
    // Turkish visitor on the English page.
    for (const key of Object.keys(LEGACY_UNPREFIXED)) {
      expect(Object.keys(LEGACY_TR_PREFIXED), key).toContain(key);
    }
  });
});

describe("legacyRedirectTarget", () => {
  it("keeps a /tr prefixed path out of the unprefixed table", () => {
    expect(legacyRedirectTarget("/tr/projects/gpa-calculator")).toBe(
      "/projeler/not-ortalamasi-hesaplayici"
    );
    expect(legacyRedirectTarget("/projects/gpa-calculator")).toBe(
      "/en/projects/gpa-calculator"
    );
  });

  it("returns null for a path it does not own", () => {
    expect(legacyRedirectTarget("/")).toBeNull();
    expect(legacyRedirectTarget("/yazilar")).toBeNull();
    expect(legacyRedirectTarget("/en/blog")).toBeNull();
    expect(legacyRedirectTarget("/robots.txt")).toBeNull();
  });

  it("normalizes a trailing slash before the lookup", () => {
    expect(legacyRedirectTarget("/about/")).toBe("/en/about");
    expect(legacyRedirectTarget("/tr/")).toBe("/");
  });

  it("resolves an unlisted /tr remainder to itself", () => {
    expect(legacyRedirectTarget("/tr/yazilar/capt-sinavina-hazirlik")).toBe(
      "/yazilar/capt-sinavina-hazirlik"
    );
  });
});
