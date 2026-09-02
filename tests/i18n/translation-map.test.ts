import { afterEach, describe, expect, it, vi } from "vitest";
import { routing } from "@/i18n/routing";
import {
  buildTranslationMap,
  getPost,
  getPosts,
  getProject,
  getProjects,
} from "@/lib/content";

/**
 * The language switcher's data source.
 *
 * It replaces the old getUntranslatedPaths list, which answered "is this path
 * missing in the other locale" with a path built from the current locale's
 * own slug. That question stopped being answerable from a path the moment a
 * translation got its own slug: /yazilar/coolify-ile-kendi-sunucumda and
 * /en/blog/self-hosting-with-coolify are the same post and share no segment.
 * The map answers the only question the switcher actually has, "where does
 * this page live in that locale", and a missing translation is the absence of
 * an entry rather than a second list that can drift out of step with the
 * first.
 */
describe("buildTranslationMap", () => {
  it("carries every locale's own path for a post whose slug differs per locale", () => {
    expect(
      buildTranslationMap("tr").post["coolify-ile-kendi-sunucumda"]
    ).toEqual({
      tr: "/yazilar/coolify-ile-kendi-sunucumda",
      en: "/en/blog/self-hosting-with-coolify",
    });
    expect(
      buildTranslationMap("en").post["capt-preparation-in-a-docker-lab"]
    ).toEqual({
      tr: "/yazilar/capt-sinavina-hazirlik",
      en: "/en/blog/capt-preparation-in-a-docker-lab",
    });
  });

  it("keys projects by the current locale's slug and points at the other locale's slug", () => {
    expect(
      buildTranslationMap("tr").project["not-ortalamasi-hesaplayici"]
    ).toEqual({
      tr: "/projeler/not-ortalamasi-hesaplayici",
      en: "/en/projects/gpa-calculator",
    });
  });

  it("resolves a brand project that keeps one slug in both locales", () => {
    // Not a special case in the code: the same translationKey lookup happens
    // to return the same slug twice, and the localized section path is still
    // what makes the two entries differ.
    expect(buildTranslationMap("tr").project["koklu-hukuk"]).toEqual({
      tr: "/projeler/koklu-hukuk",
      en: "/en/projects/koklu-hukuk",
    });
  });

  it("includes the active locale so the switcher's own link stays on the page", () => {
    // The active locale renders a link too. Without its own entry it would
    // fall through to the section root and the current page's own language
    // button would navigate away from the current page.
    for (const locale of routing.locales) {
      const map = buildTranslationMap(locale);
      for (const kind of ["post", "project"] as const) {
        for (const [slug, targets] of Object.entries(map[kind])) {
          expect(targets[locale], `${kind}/${slug}`).toBeDefined();
        }
      }
    }
  });

  it("keys only slugs that exist in the given locale and covers all of them", () => {
    for (const locale of routing.locales) {
      const map = buildTranslationMap(locale);
      expect(Object.keys(map.post).sort()).toEqual(
        getPosts(locale)
          .map((post) => post.slug)
          .sort()
      );
      expect(Object.keys(map.project).sort()).toEqual(
        getProjects(locale)
          .map((project) => project.slug)
          .sort()
      );
    }
  });

  it("only names target paths that a real page answers", () => {
    const shape = /^(?:\/en)?\/(blog|projects|yazilar|projeler)\/([^/]+)$/;

    for (const locale of routing.locales) {
      const map = buildTranslationMap(locale);
      for (const kind of ["post", "project"] as const) {
        for (const targets of Object.values(map[kind])) {
          for (const [target, href] of Object.entries(targets)) {
            const slug = shape.exec(href)?.[2];
            expect(slug, href).toBeDefined();
            const lookup = kind === "post" ? getPost : getProject;
            expect(
              lookup(target as (typeof routing.locales)[number], slug ?? ""),
              href
            ).toBeDefined();
          }
        }
      }
    }
  });
});

const FIXTURE_POST = {
  title: "Fixture",
  slug: "fixture",
  translationKey: "fixture",
  legacySlugs: [],
  date: "2026-01-01",
  summary: "Fixture summary.",
  tags: [],
  draft: false,
  path: "blog/en/fixture.mdx",
  code: "",
  metadata: { readingTime: 1, wordCount: 100 },
  locale: "en",
};

const FIXTURE_PROJECT = {
  title: "Fixture",
  slug: "fixture",
  translationKey: "fixture",
  legacySlugs: [],
  summary: "Fixture summary.",
  role: "Role",
  stack: ["TypeScript"],
  year: 2026,
  links: {},
  outcome: "Outcome.",
  featured: false,
  draft: false,
  order: 100,
  path: "projects/en/fixture.mdx",
  code: "",
  locale: "en",
};

async function contentWith(
  fixture: {
    posts?: Array<Record<string, unknown>>;
    projects?: Array<Record<string, unknown>>;
  },
  nodeEnv: string
) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.doMock("#site/content", () => ({
    posts: fixture.posts ?? [],
    projects: fixture.projects ?? [],
  }));
  return import("@/lib/content");
}

afterEach(() => {
  vi.doUnmock("#site/content");
  vi.unstubAllEnvs();
  vi.resetModules();
});

// The real content is fully bilingual, so the branch that has to keep the
// switcher off a 404 has no real input to run against. These two cases used
// to live in tests/content-layer.test.ts under "content translated into one
// locale only"; they moved with the behaviour.
describe("content translated into one locale only", () => {
  const posts = [
    { ...FIXTURE_POST, slug: "en-only", translationKey: "en-only" },
  ];
  const projects = [
    {
      ...FIXTURE_PROJECT,
      slug: "tr-only",
      translationKey: "tr-only",
      path: "projects/tr/tr-only.mdx",
      locale: "tr",
    },
  ];

  it("leaves the missing locale out so the switcher falls back to the section root", async () => {
    const content = await contentWith({ posts, projects }, "production");

    expect(content.buildTranslationMap("en").post["en-only"]).toEqual({
      en: "/en/blog/en-only",
    });
    expect(content.buildTranslationMap("tr").post).toEqual({});
    expect(content.buildTranslationMap("tr").project["tr-only"]).toEqual({
      tr: "/projeler/tr-only",
    });
    expect(content.buildTranslationMap("en").project).toEqual({});
  });

  it("keeps a draft out of the map in production", async () => {
    const content = await contentWith(
      {
        posts: [
          { ...FIXTURE_POST, slug: "shipped", translationKey: "shipped" },
          {
            ...FIXTURE_POST,
            slug: "unpublished",
            translationKey: "unpublished",
            draft: true,
          },
        ],
      },
      "production"
    );

    expect(Object.keys(content.buildTranslationMap("en").post)).toEqual([
      "shipped",
    ]);
  });
});
