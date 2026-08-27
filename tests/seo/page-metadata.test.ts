import type { Metadata } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routing, type AppLocale } from "@/i18n/routing";
import { getPostSlugs, getProjectSlugs } from "@/lib/content";

// next/font/local is a build time only export: outside the Next compiler
// (webpack or SWC) it resolves to an empty module, so calling it throws
// "default is not a function". This file imports the [lang] layout directly
// to call its generateMetadata, and the layout now pulls in src/fonts, so the
// loader needs a stand-in. The returned variable name is never asserted on
// here, only the metadata it returns.
vi.mock("next/font/local", () => ({
  default: () => ({ variable: "" }),
}));

// next-intl/server resolves to its client build outside a Next request, and
// getTranslations then throws. The stub keeps the real message catalogs, so a
// page that asks for a missing key still fails the test.
vi.mock("next-intl/server", () => ({
  setRequestLocale: () => {},
  getTranslations: async ({
    locale,
    namespace,
  }: {
    locale: string;
    namespace?: string;
  }) => {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return (key: string) => {
      const path = namespace ? `${namespace}.${key}` : key;
      const value = path
        .split(".")
        .reduce<unknown>(
          (node, segment) => (node as Record<string, unknown>)?.[segment],
          messages
        );
      if (typeof value !== "string") {
        throw new Error(`missing message key: ${locale}.${path}`);
      }
      return value;
    };
  },
  // Not exercised by any assertion in this file yet, but future blog pages
  // import getFormatter from next-intl/server alongside getTranslations, so
  // the mock has to keep that import from throwing.
  getFormatter: async () => ({
    dateTime: () => "",
  }),
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.sh");
});

// The slug page takes one more param than the others; a single signature that
// carries both lets every page module be called through the same helper.
type MetadataFn = (args: {
  params: Promise<{ lang: string; slug: string }>;
}) => Promise<Metadata>;

interface PageCase {
  name: string;
  path: string;
  extraParams?: { slug: string };
  // Locales this page case should be exercised for. Undefined means every
  // routed locale. A post that only exists in one locale (no translation
  // yet) has to be scoped here, otherwise the untranslated locale calls
  // notFound() inside generateMetadata and the test throws.
  locales?: readonly AppLocale[];
  load: () => Promise<{ generateMetadata: MetadataFn }>;
}

const PAGES: PageCase[] = [
  { name: "home", path: "/", load: () => import("@/app/[lang]/page") },
  {
    name: "about",
    path: "/about",
    load: () => import("@/app/[lang]/about/page"),
  },
  {
    name: "projects",
    path: "/projects",
    load: () => import("@/app/[lang]/projects/page"),
  },
  {
    name: "blog",
    path: "/blog",
    load: () => import("@/app/[lang]/blog/page"),
  },
  {
    name: "contact",
    path: "/contact",
    load: () => import("@/app/[lang]/contact/page"),
  },
  ...getProjectSlugs("en").map((slug) => ({
    name: `projects/${slug}`,
    path: `/projects/${slug}`,
    extraParams: { slug },
    load: () => import("@/app/[lang]/projects/[slug]/page"),
  })),
  // The locale is baked into the case name because a bilingual post (like
  // self-hosting-with-coolify) produces one PAGES entry per locale that
  // otherwise share the same `blog/<slug>` name, which would collapse into
  // duplicate it.each test titles.
  ...routing.locales.flatMap((locale) =>
    getPostSlugs(locale).map((slug) => ({
      name: `blog/${slug} [${locale}]`,
      path: `/blog/${slug}`,
      extraParams: { slug },
      locales: [locale],
      load: () => import("@/app/[lang]/blog/[slug]/page"),
    }))
  ),
];

const CASES = routing.locales.flatMap((locale) =>
  PAGES.filter((page) => !page.locales || page.locales.includes(locale)).map(
    (page) => ({ locale, page })
  )
);

async function metadataFor(
  page: (typeof PAGES)[number],
  locale: AppLocale
): Promise<Metadata> {
  const mod = (await page.load()) as { generateMetadata: MetadataFn };
  const slug = page.extraParams ? page.extraParams.slug : "";
  return mod.generateMetadata({
    params: Promise.resolve({ lang: locale, slug }),
  });
}

function pageTitle(metadata: Metadata): string {
  const title = metadata.title;
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "absolute" in title) {
    return title.absolute as string;
  }
  throw new Error("page metadata has no plain title");
}

describe("page openGraph metadata", () => {
  // Regression guard: Next merges metadata shallowly, so a page that returns
  // no openGraph inherits the locale layout one and advertises the home page
  // url and title while its own canonical points elsewhere.
  it.each(CASES)(
    "$page.name in $locale points og:url at its own canonical",
    async ({ locale, page }) => {
      const metadata = await metadataFor(page, locale);
      const canonical = metadata.alternates?.canonical;
      const openGraph = metadata.openGraph;

      expect(openGraph, `${page.name} returns no openGraph`).toBeTruthy();
      expect(openGraph).toHaveProperty("url");
      expect(String((openGraph as { url: string }).url)).toBe(
        String(canonical)
      );
    }
  );

  it.each(CASES)(
    "$page.name in $locale repeats its own title and description in og",
    async ({ locale, page }) => {
      const metadata = await metadataFor(page, locale);
      const openGraph = metadata.openGraph as {
        title: string;
        description: string;
        siteName: string;
        locale: string;
        alternateLocale: string[];
      };

      expect(openGraph.title).toBe(pageTitle(metadata));
      expect(openGraph.description).toBe(metadata.description);
      expect(openGraph.siteName).toBeTruthy();
      expect(openGraph.locale).toBe(locale === "tr" ? "tr_TR" : "en_US");
      expect(openGraph.alternateLocale).not.toContain(openGraph.locale);
    }
  );

  it.each(CASES)(
    "$page.name in $locale keeps the og image of its own locale",
    async ({ locale, page }) => {
      const metadata = await metadataFor(page, locale);
      const images = (
        metadata.openGraph as {
          images: { url: string; alt: string; width: number }[];
        }
      ).images;

      // The opengraph-image.tsx file convention only reaches the [lang]
      // segment. A page that returns its own openGraph drops the inherited
      // image unless it names it again.
      expect(images).toHaveLength(1);
      expect(images[0].url).toBe(
        locale === "en"
          ? "https://dogancanyildiz.sh/opengraph-image/default"
          : "https://dogancanyildiz.sh/tr/opengraph-image/default"
      );
      expect(images[0].width).toBe(1200);
      expect(images[0].alt).toBeTruthy();
    }
  );

  it("renders the og image route at the path the pages link to", async () => {
    const descriptor = await import("@/lib/seo/og-image");
    const route = await import("@/app/[lang]/opengraph-image");

    expect(descriptor.OG_IMAGE_PATH).toBe(
      `/opengraph-image/${descriptor.OG_IMAGE_ID}`
    );
    expect(route.size).toEqual(descriptor.OG_IMAGE_SIZE);
    expect(route.contentType).toBe(descriptor.OG_IMAGE_CONTENT_TYPE);

    const [image] = await route.generateImageMetadata({
      params: Promise.resolve({ lang: "tr" }),
    });
    expect(image.id).toBe(descriptor.OG_IMAGE_ID);
  });

  it("keeps the locale layout on the home page url", async () => {
    const layout = await import("@/app/[lang]/layout");
    const metadata = await layout.generateMetadata({
      params: Promise.resolve({ lang: "tr" }),
    });

    expect((metadata.openGraph as { url: string }).url).toBe(
      "https://dogancanyildiz.sh/tr"
    );
  });

  it("gives every locale a distinct og:url for the same page", async () => {
    const urls = await Promise.all(
      routing.locales.map(async (locale) => {
        const metadata = await metadataFor(PAGES[1], locale);
        return (metadata.openGraph as { url: string }).url;
      })
    );

    expect(new Set(urls).size).toBe(routing.locales.length);
    expect(urls).toContain("https://dogancanyildiz.sh/about");
    expect(urls).toContain("https://dogancanyildiz.sh/tr/about");
  });

  it("marks the project detail page openGraph type as article", async () => {
    const detailPage = PAGES.find((page) => page.name.startsWith("projects/"));
    if (!detailPage) throw new Error("no project detail page case found");

    const metadata = await metadataFor(detailPage, "en");

    expect((metadata.openGraph as { type: string }).type).toBe("article");
  });

  it.each(CASES)(
    "$page.name in $locale points its rss feed link at its own locale",
    async ({ locale, page }) => {
      const metadata = await metadataFor(page, locale);
      const types = metadata.alternates?.types as
        Record<string, { url: string }[]> | undefined;
      const feedLinks = types?.["application/rss+xml"];

      expect(feedLinks, `${page.name} has no rss feed alternate`).toBeTruthy();
      expect(String(feedLinks?.[0]?.url)).toBe(
        locale === "en"
          ? "https://dogancanyildiz.sh/feed.xml"
          : "https://dogancanyildiz.sh/tr/feed.xml"
      );
    }
  );

  it("marks the post detail page openGraph type as article with its published time", async () => {
    const postPage = PAGES.find(
      (page) => page.name === "blog/self-hosting-with-coolify [tr]"
    );
    if (!postPage) throw new Error("no post detail page case found");
    const locale = postPage.locales?.[0] ?? "en";

    const metadata = await metadataFor(postPage, locale);
    const openGraph = metadata.openGraph as {
      type: string;
      publishedTime: string;
    };

    expect(openGraph.type).toBe("article");
    expect(openGraph.publishedTime).toMatch(/^2026-08-20/);
  });

  it("gives the bilingual post both languages in its alternates on the english case", async () => {
    const postPage = PAGES.find(
      (page) => page.name === "blog/self-hosting-with-coolify [en]"
    );
    if (!postPage) throw new Error("no english case for the bilingual post");

    const metadata = await metadataFor(postPage, "en");
    const languages = metadata.alternates?.languages as
      Record<string, string> | undefined;

    expect(languages?.en).toBeTruthy();
    expect(languages?.tr).toBeTruthy();
  });

  it("gives a turkish only post only tr and x-default in its alternates", async () => {
    const postPage = PAGES.find(
      (page) => page.name === "blog/capt-sinavina-hazirlik [tr]"
    );
    if (!postPage) {
      throw new Error("no turkish case for the turkish only post");
    }

    const metadata = await metadataFor(postPage, "tr");
    const languages = metadata.alternates?.languages as
      Record<string, string> | undefined;

    expect(Object.keys(languages ?? {}).sort()).toEqual(["tr", "x-default"]);
  });
});
