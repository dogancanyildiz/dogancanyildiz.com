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

  it("answers an old slug under the new Turkish section path", () => {
    // Never published addresses: /yazilar and /projeler/<slug> only exist
    // since 2026-09-02. Without these rows dynamicParams = false turns them
    // into a 404 for anyone who edits the section of a working URL by hand.
    expect(legacyRedirectTarget("/yazilar/self-hosting-with-coolify")).toBe(
      "/yazilar/coolify-ile-kendi-sunucumda"
    );
    expect(legacyRedirectTarget("/projeler/gpa-calculator")).toBe(
      "/projeler/not-ortalamasi-hesaplayici"
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

describe("legacy OpenGraph card addresses", () => {
  const CARD = "/opengraph-image/default";

  it("moves the five published cards whose page address changed", () => {
    // Every detail page named its own card in og:image and both feeds put it
    // in media:content, so these were public URLs. Their pages moved; before
    // the card rule next-intl 307'd them to a path that does not exist.
    const cases: ReadonlyArray<readonly [string, string]> = [
      ["/blog/self-hosting-with-coolify", "/en/blog/self-hosting-with-coolify"],
      ["/projects/gpa-calculator", "/en/projects/gpa-calculator"],
      [
        "/projects/ticket-purchasing-system",
        "/en/projects/ticket-purchasing-system",
      ],
      [
        "/en/blog/capt-sinavina-hazirlik",
        "/en/blog/capt-preparation-in-a-docker-lab",
      ],
      [
        "/en/blog/ccna-dan-web-guvenligine",
        "/en/blog/from-ccna-to-web-security",
      ],
    ];

    for (const [oldPath, newPath] of cases) {
      expect(legacyRedirectTarget(`${oldPath}${CARD}`), oldPath).toBe(
        `${newPath}${CARD}`
      );
    }
  });

  it("sends a card wherever its own page goes, for every detail key", () => {
    // The rule is derived from the tables, not a fourth table, so this walks
    // the same keys the page redirects use.
    const detailKeys = [
      ...Object.keys(LEGACY_UNPREFIXED),
      ...Object.keys(LEGACY_EN_PREFIXED),
    ].filter((key) => key.replace(/^\/en/, "").split("/").length === 3);
    expect(detailKeys.length).toBeGreaterThanOrEqual(10);

    for (const key of detailKeys) {
      const page = legacyRedirectTarget(key);
      expect(page, key).not.toBeNull();
      expect(legacyRedirectTarget(`${key}${CARD}`), key).toBe(`${page}${CARD}`);
    }
  });

  it("resolves a /tr prefixed card in a single hop", () => {
    expect(
      legacyRedirectTarget(`/tr/blog/self-hosting-with-coolify${CARD}`)
    ).toBe(`/yazilar/coolify-ile-kendi-sunucumda${CARD}`);
    expect(legacyRedirectTarget(`/tr/projects/gpa-calculator${CARD}`)).toBe(
      `/projeler/not-ortalamasi-hesaplayici${CARD}`
    );
  });

  it("leaves the identity card and the canonical cards alone", () => {
    // /tr/opengraph-image/default still moves, but as a plain /tr leftover:
    // there is no detail page under it for the card rule to look up.
    expect(legacyRedirectTarget(`/tr${CARD}`)).toBe(CARD);
    expect(legacyRedirectTarget(CARD)).toBeNull();
    expect(legacyRedirectTarget(`/en${CARD}`)).toBeNull();
    expect(
      legacyRedirectTarget(`/yazilar/coolify-ile-kendi-sunucumda${CARD}`)
    ).toBeNull();
    expect(
      legacyRedirectTarget(`/en/blog/self-hosting-with-coolify${CARD}`)
    ).toBeNull();
    expect(legacyRedirectTarget(`/projeler/hubit${CARD}`)).toBeNull();
  });

  it("does not invent a card route for a section page", () => {
    // /blog redirects, but a section page has no card of its own: appending
    // the suffix to /en/blog would 308 into the same 404.
    expect(legacyRedirectTarget(`/blog${CARD}`)).toBeNull();
    expect(legacyRedirectTarget(`/projects${CARD}`)).toBeNull();
  });
});
