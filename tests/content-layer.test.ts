import { afterEach, describe, expect, it, vi } from "vitest";
import { routing } from "@/i18n/routing";
import {
  getHomeProjects,
  getPost,
  getPostLocales,
  getPosts,
  getProject,
  getProjectLocales,
  getProjectSlugs,
  getProjects,
  getUntranslatedPaths,
  toPostCardData,
  toProjectCardData,
} from "@/lib/content";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * These tests deliberately assert properties rather than the current slug
 * list. The list version broke on every new post and had to be hand edited,
 * which trains an author to update the expectation instead of reading the
 * failure, and it never actually checked the behaviour the content layer is
 * responsible for.
 *
 * The behaviour that content cannot demonstrate on its own (a draft, a post
 * that exists in one locale only) is covered further down against a synthetic
 * collection.
 */
describe("project content layer", () => {
  it.each([...routing.locales])(
    "returns only %s projects for that locale",
    (locale) => {
      const list = getProjects(locale);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((project) => project.locale === locale)).toBe(true);
    }
  );

  it("sorts projects by order, then newest year, then title", () => {
    const list = getProjects("en");
    for (let index = 1; index < list.length; index += 1) {
      const previous = list[index - 1];
      const current = list[index];
      if (!previous || !current) {
        throw new Error(`missing project around index ${index}`);
      }
      if (previous.order !== current.order) {
        expect(previous.order).toBeLessThan(current.order);
        continue;
      }
      if (previous.year !== current.year) {
        expect(previous.year).toBeGreaterThan(current.year);
        continue;
      }
      expect(previous.title.localeCompare(current.title, "en")).toBeLessThan(0);
    }
  });

  it("finds every listed project by its own slug and locale", () => {
    for (const locale of routing.locales) {
      for (const project of getProjects(locale)) {
        expect(getProject(locale, project.slug)?.title).toBe(project.title);
      }
    }
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProject("en", "does-not-exist")).toBeUndefined();
  });

  it("lists no locales for a slug that does not exist", () => {
    expect(getProjectLocales("does-not-exist")).toEqual([]);
  });

  it("lists exactly the locales a slug is actually present in", () => {
    for (const slug of getProjectSlugs("en")) {
      const locales = getProjectLocales(slug);
      expect(locales.length).toBeGreaterThan(0);
      for (const locale of locales) {
        expect(getProject(locale, slug)).toBeDefined();
      }
      for (const locale of routing.locales) {
        if (locales.includes(locale)) continue;
        expect(getProject(locale, slug)).toBeUndefined();
      }
    }
  });

  it("builds a locale neutral href in the card dto", () => {
    for (const project of getProjects("en")) {
      const card = toProjectCardData(project);
      expect(card.href).toBe(`/projects/${project.slug}`);
      expect(card.title).toBe(project.title);
      expect(card.liveUrl).toBe(project.links.live ?? null);
      expect(card.repoUrl).toBe(project.links.repo ?? null);
    }
  });

  it("never returns a slug that is not a valid url segment", () => {
    for (const locale of routing.locales) {
      for (const slug of getProjectSlugs(locale)) {
        expect(slug).toMatch(SLUG_PATTERN);
      }
    }
  });

  it("only publishes https outbound links", () => {
    for (const locale of routing.locales) {
      for (const project of getProjects(locale)) {
        for (const url of [project.links.live, project.links.repo]) {
          if (!url) continue;
          expect(url.startsWith("https://"), url).toBe(true);
        }
      }
    }
  });
});

describe("post content layer", () => {
  it.each([...routing.locales])(
    "returns only %s posts, newest first",
    (locale) => {
      const list = getPosts(locale);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((post) => post.locale === locale)).toBe(true);

      const dates = list.map((post) => post.date);
      expect(dates).toEqual([...dates].sort().reverse());
    }
  );

  it("finds every listed post by its own slug and locale", () => {
    for (const locale of routing.locales) {
      for (const post of getPosts(locale)) {
        expect(getPost(locale, post.slug)?.title).toBe(post.title);
      }
    }
  });

  it("lists no locales for a slug that does not exist", () => {
    expect(getPostLocales("nothing")).toEqual([]);
  });

  it("builds a locale neutral href and a reading time of at least a minute", () => {
    for (const post of getPosts("tr")) {
      const card = toPostCardData(post);
      expect(card.href).toBe(`/blog/${post.slug}`);
      expect(card.readingTime).toBeGreaterThanOrEqual(1);
      expect(card.date).toBe(post.date);
      expect(card.date).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  it("publishes no draft in the test environment", () => {
    for (const locale of routing.locales) {
      expect(getPosts(locale).every((post) => !post.draft)).toBe(true);
      expect(getProjects(locale).every((project) => !project.draft)).toBe(true);
    }
  });
});

describe("untranslated paths", () => {
  it("names only paths that are missing in the given locale", () => {
    for (const locale of routing.locales) {
      for (const path of getUntranslatedPaths(locale)) {
        const [, section, slug] = path.split("/");
        if (!slug) {
          throw new Error(`unexpected untranslated path: ${path}`);
        }
        const lookup = section === "blog" ? getPost : getProject;

        expect(lookup(locale, slug), path).toBeUndefined();
        expect(
          routing.locales.some((candidate) => lookup(candidate, slug)),
          path
        ).toBe(true);
      }
    }
  });

  it("returns a sorted list with no duplicates", () => {
    for (const locale of routing.locales) {
      const paths = getUntranslatedPaths(locale);
      expect(paths).toEqual([...paths].sort());
      expect(new Set(paths).size).toBe(paths.length);
    }
  });
});

// A synthetic collection, because the real content is fully bilingual and
// carries no draft: the draft filter and the single locale branch have no
// real input to run against, and both are exactly the code whose failure
// would leak an unpublished page into the sitemap or link a hreflang tag at a
// 404.
const FIXTURE_POST = {
  title: "Fixture",
  slug: "fixture",
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

describe("draft filter", () => {
  const posts = [
    { ...FIXTURE_POST, slug: "published" },
    { ...FIXTURE_POST, slug: "unpublished", draft: true },
  ];
  const projects = [
    { ...FIXTURE_PROJECT, slug: "published" },
    { ...FIXTURE_PROJECT, slug: "unpublished", draft: true, order: 101 },
  ];

  it("hides a draft post and a draft project in production", async () => {
    const content = await contentWith({ posts, projects }, "production");

    expect(content.getPostSlugs("en")).toEqual(["published"]);
    expect(content.getPost("en", "unpublished")).toBeUndefined();
    expect(content.getProjectSlugs("en")).toEqual(["published"]);
    expect(content.getProject("en", "unpublished")).toBeUndefined();
  });

  it("keeps drafts visible in development so they can be reviewed", async () => {
    const content = await contentWith({ posts, projects }, "development");

    expect(content.getPostSlugs("en").sort()).toEqual([
      "published",
      "unpublished",
    ]);
    expect(content.getProjectSlugs("en").sort()).toEqual([
      "published",
      "unpublished",
    ]);
  });

  it("keeps a draft out of the locale list a hreflang tag is built from", async () => {
    const content = await contentWith({ posts, projects }, "production");

    expect(content.getPostLocales("unpublished")).toEqual([]);
    expect(content.getProjectLocales("unpublished")).toEqual([]);
  });
});

describe("content translated into one locale only", () => {
  const posts = [{ ...FIXTURE_POST, slug: "en-only" }];
  const projects = [
    {
      ...FIXTURE_PROJECT,
      slug: "tr-only",
      path: "projects/tr/tr-only.mdx",
      locale: "tr",
    },
  ];

  it("reports the single locale, not both", async () => {
    const content = await contentWith({ posts, projects }, "production");

    expect(content.getPostLocales("en-only")).toEqual(["en"]);
    expect(content.getProjectLocales("tr-only")).toEqual(["tr"]);
  });

  it("names the missing translation so the language switcher can avoid a 404", async () => {
    const content = await contentWith({ posts, projects }, "production");

    expect(content.getUntranslatedPaths("tr")).toEqual(["/blog/en-only"]);
    expect(content.getUntranslatedPaths("en")).toEqual(["/projects/tr-only"]);
  });

  it("does not leak the other locale into the hreflang set", async () => {
    const content = await contentWith({ posts, projects }, "production");
    const { buildLanguageAlternates } = await import("@/lib/seo/alternates");

    const languages = buildLanguageAlternates(
      "/blog/en-only",
      content.getPostLocales("en-only")
    );
    expect(Object.keys(languages).sort()).toEqual(["en", "x-default"]);
  });
});

// The home page used to render getProjects(locale) in full, so the "Selected
// work" section was a copy of the projects page. The selection rule now lives
// in the content layer instead of inside the page component, because this is
// the part that has to keep working: a synthetic collection can show both the
// featured branch and the fallback, which the real content (two featured
// projects, always) cannot.
describe("home page project selection", () => {
  const featuredProject = {
    ...FIXTURE_PROJECT,
    slug: "featured",
    featured: true,
    order: 1,
  };
  const plain = (slug: string, order: number) => ({
    ...FIXTURE_PROJECT,
    slug,
    order,
  });

  it("shows only the featured projects when frontmatter marks any", async () => {
    const content = await contentWith(
      {
        projects: [
          featuredProject,
          plain("second", 2),
          plain("third", 3),
          plain("fourth", 4),
        ],
      },
      "production"
    );

    expect(content.getHomeProjects("en").map((p) => p.slug)).toEqual([
      "featured",
    ]);
  });

  it("falls back to the first few by list order when nothing is featured", async () => {
    const content = await contentWith(
      {
        projects: [
          plain("first", 1),
          plain("second", 2),
          plain("third", 3),
          plain("fourth", 4),
        ],
      },
      "production"
    );

    expect(content.getHomeProjects("en").map((p) => p.slug)).toEqual([
      "first",
      "second",
      "third",
    ]);
    expect(content.HOME_PROJECT_FALLBACK_COUNT).toBe(3);
  });

  it("returns nothing for an empty collection, so the page can show its empty state", async () => {
    const content = await contentWith({ projects: [] }, "production");

    expect(content.getHomeProjects("en")).toEqual([]);
    expect(content.getHomeProjects("tr")).toEqual([]);
  });

  it("never shows a draft and never shows the whole projects page", () => {
    for (const locale of routing.locales) {
      const home = getHomeProjects(locale);
      const all = getProjects(locale);
      expect(home.length).toBeGreaterThan(0);
      expect(home.length).toBeLessThanOrEqual(all.length);
      for (const project of home) {
        expect(project.draft).toBe(false);
        expect(all.some((candidate) => candidate.slug === project.slug)).toBe(
          true
        );
      }
    }
  });
});
