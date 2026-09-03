import type { Metadata } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  getPost,
  getPostSlugs,
  getProject,
  getProjectSlugs,
} from "@/lib/content";

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
    return (key: string, values?: Record<string, string>) => {
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
      // Plain ICU placeholders only, which is all the metadata namespace
      // uses. Without this the og image alt would come back with a literal
      // "{title}" in it and an assertion on the real title could not tell the
      // difference.
      return value.replace(/\{\s*(\w+)\s*\}/g, (match, name: string) =>
        values && name in values ? String(values[name]) : match
      );
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
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.com");
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
  {
    name: "services",
    path: "/services",
    load: () => import("@/app/[lang]/services/page"),
  },
  {
    name: "privacy",
    path: "/privacy",
    load: () => import("@/app/[lang]/privacy/page"),
  },
  {
    name: "coming-soon",
    path: "/coming-soon",
    load: () => import("@/app/[lang]/coming-soon/page"),
  },
  {
    name: "updating",
    path: "/updating",
    load: () => import("@/app/[lang]/updating/page"),
  },
  // The locale is baked into the case name and each case is scoped to its
  // own locale, because a project's slug is no longer guaranteed to be the
  // same in both locales (not-ortalamasi-hesaplayici and
  // bilet-satin-alma-sistemi are Turkish renames of gpa-calculator and
  // ticket-purchasing-system). Sharing one PAGES entry across both locales,
  // as this used to, would call generateMetadata with the English slug under
  // the Turkish locale and hit notFound() for exactly those two projects.
  ...routing.locales.flatMap((locale) =>
    getProjectSlugs(locale).map((slug) => ({
      name: `projects/${slug} [${locale}]`,
      path: `/projects/${slug}`,
      extraParams: { slug },
      locales: [locale],
      load: () => import("@/app/[lang]/projects/[slug]/page"),
    }))
  ),
  // Same reason: a bilingual post (like self-hosting-with-coolify) produces
  // one PAGES entry per locale that otherwise share the same `blog/<slug>`
  // name, which would collapse into duplicate it.each test titles.
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
  const mod = await page.load();
  const slug = page.extraParams ? page.extraParams.slug : "";
  return mod.generateMetadata({
    params: Promise.resolve({ lang: locale, slug }),
  });
}

function pageTitle(metadata: Metadata): string {
  const title = metadata.title;
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "absolute" in title) {
    return title.absolute;
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
    "$page.name in $locale carries its own title, branded, and its description in og",
    async ({ locale, page }) => {
      const messages = (await import(`../../messages/${locale}.json`)).default;
      const siteName = messages.metadata.siteName as string;
      const metadata = await metadataFor(page, locale);
      const openGraph = metadata.openGraph as {
        title: string;
        description: string;
        siteName: string;
        locale: string;
        alternateLocale: string[];
      };

      // The document title picks up the brand from the layout's title
      // template. openGraph has no template, so a share card would have shown
      // a bare "About" unless the same suffix is applied here. The home page
      // is the exception: its title is already the full brand line.
      const title = pageTitle(metadata);
      const branded = title.includes(siteName)
        ? title
        : `${title} | ${siteName}`;

      expect(openGraph.title).toBe(branded);
      expect(openGraph.title).toContain(siteName);
      expect(openGraph.description).toBe(metadata.description);
      expect(openGraph.siteName).toBe(siteName);
      expect(openGraph.locale).toBe(locale === "tr" ? "tr_TR" : "en_US");
      expect(openGraph.alternateLocale).not.toContain(openGraph.locale);
    }
  );

  it.each([...routing.locales])(
    "%s default title says what he does, not only who he is",
    async (locale) => {
      const messages = (await import(`../../messages/${locale}.json`)).default;
      const defaultTitle = messages.metadata.defaultTitle as string;
      const siteName = messages.metadata.siteName as string;

      // The branded check above is satisfied by the name alone, which is what
      // the home title used to be: a search result that named a person and
      // said nothing about the work. The title has to carry the name and a
      // role signal on top of it, and still fit in what a result page shows.
      expect(defaultTitle).toContain(siteName);
      expect(defaultTitle.length).toBeGreaterThan(siteName.length + 10);
      expect(defaultTitle.length).toBeLessThan(70);
      expect(defaultTitle).toMatch(/Developer|Geliştirici/);
      expect(defaultTitle).toMatch(/DevOps/);
    }
  );

  it.each(CASES)(
    "$page.name in $locale keeps the og image of its own locale",
    async ({ locale, page }) => {
      const { ogImageHref } = await import("@/i18n/navigation");
      const { absoluteUrl, siteUrl } = await import("@/lib/seo/alternates");
      const { OG_IMAGE_PATH } = await import("@/lib/seo/og-image");
      const metadata = await metadataFor(page, locale);
      const images = (
        metadata.openGraph as {
          images: { url: string; alt: string; width: number }[];
        }
      ).images;

      // Next merges metadata shallowly and replaces openGraph wholesale, so a
      // page that returns its own object drops the inherited image unless it
      // names one. Detail pages name their own card, everything else falls
      // back to the identity image on the [lang] segment.
      expect(images).toHaveLength(1);
      const [ogImage] = images;
      if (!ogImage) throw new Error(`${page.name} published no og image`);

      // A content page's own slug is no longer guaranteed to match across
      // locales, so its card path can only be rebuilt through ogImageHref
      // (the same function the page itself calls), not by string pasting
      // page.path onto a prefix.
      const ownCard = /^(projects|blog)\//.test(page.name);
      const expectedUrl = ownCard
        ? `${siteUrl()}${ogImageHref(
            locale,
            page.name.startsWith("blog/") ? "post" : "project",
            page.path.split("/").pop() ?? ""
          )}`
        : absoluteUrl(locale, OG_IMAGE_PATH);
      expect(ogImage.url).toBe(expectedUrl);
      expect(ogImage.width).toBe(1200);
      expect(ogImage.alt).toBeTruthy();
    }
  );

  it.each([
    {
      section: "blog",
      kind: "post" as const,
      route: () => import("@/app/[lang]/blog/[slug]/opengraph-image"),
    },
    {
      section: "projects",
      kind: "project" as const,
      route: () => import("@/app/[lang]/projects/[slug]/opengraph-image"),
    },
  ])(
    "$section detail pages have a card at the path their metadata names",
    async ({ section, kind, route: load }) => {
      const { contentHref, ogImageHref } = await import("@/i18n/navigation");
      const { OG_IMAGE_PATH } = await import("@/lib/seo/og-image");
      const route = await load();

      // Every slug the page prerenders has to have an image param too,
      // otherwise the url in og:image resolves to nothing.
      const slugs = new Set(
        route.generateStaticParams().map(({ lang, slug }) => `${lang}/${slug}`)
      );
      const expected =
        section === "blog"
          ? routing.locales.flatMap((locale) =>
              getPostSlugs(locale).map((slug) => `${locale}/${slug}`)
            )
          : routing.locales.flatMap((locale) =>
              getProjectSlugs(locale).map((slug) => `${locale}/${slug}`)
            );
      expect([...slugs].sort()).toEqual([...expected].sort());

      // The join heuristic ogImagePathFor used to hand-implement is now
      // getPathname's own localized template; this pins that the two still
      // agree, for every routed locale, once the content path is localized.
      for (const locale of routing.locales) {
        expect(ogImageHref(locale, kind, "some-slug")).toBe(
          `${contentHref(locale, kind, "some-slug")}${OG_IMAGE_PATH}`
        );
      }

      const slug =
        section === "blog" ? getPostSlugs("tr")[0] : getProjectSlugs("tr")[0];
      if (!slug) throw new Error(`the tr ${section} collection is empty`);
      const title =
        section === "blog"
          ? getPost("tr", slug)?.title
          : getProject("tr", slug)?.title;

      const [image] = await route.generateImageMetadata({
        params: Promise.resolve({ lang: "tr", slug }),
      });
      if (!image) throw new Error(`${section} card published no image id`);
      expect(image.id).toBe("default");
      // The card leads with the page title, so the alt has to name it rather
      // than repeat the identity line that belongs to the [lang] image.
      expect(image.alt).toContain(title);

      // The enumeration call arrives without a slug and still has to answer
      // with something, which is where the identity alt is the right text.
      const [fallback] = await route.generateImageMetadata({
        params: Promise.resolve({
          lang: "__metadata_id__",
          slug: "__metadata_id__",
        }),
      });
      expect(fallback?.alt).toBeTruthy();
      expect(fallback?.alt).not.toContain(title);
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
    if (!image) throw new Error("generateImageMetadata returned no image");
    expect(image.id).toBe(descriptor.OG_IMAGE_ID);
  });

  it("keeps the locale layout on the home page url", async () => {
    const layout = await import("@/app/[lang]/layout");
    const metadata = await layout.generateMetadata({
      params: Promise.resolve({ lang: "tr" }),
    });

    expect((metadata.openGraph as { url: string }).url).toBe(
      "https://dogancanyildiz.com/"
    );
  });

  it("gives every locale a distinct og:url for the same page", async () => {
    const aboutPage = PAGES.find((page) => page.name === "about");
    if (!aboutPage) throw new Error("no about page case found");

    const urls = await Promise.all(
      routing.locales.map(async (locale) => {
        const metadata = await metadataFor(aboutPage, locale);

        return (metadata.openGraph as { url: string }).url;
      })
    );

    expect(new Set(urls).size).toBe(routing.locales.length);
    expect(urls).toContain("https://dogancanyildiz.com/en/about");
    expect(urls).toContain("https://dogancanyildiz.com/hakkimda");
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
        Record<string, { url: string; title: string }[]> | undefined;
      const feedLinks = types?.["application/rss+xml"];

      expect(feedLinks, `${page.name} has no rss feed alternate`).toBeTruthy();
      expect(String(feedLinks?.[0]?.url)).toBe(
        locale === "en"
          ? "https://dogancanyildiz.com/en/feed.xml"
          : "https://dogancanyildiz.com/feed.xml"
      );
      // The reader UI offers the link by its title, so the two feeds have to
      // read differently: both used to be offered as the bare name.
      expect(String(feedLinks?.[0]?.title)).toContain(
        locale === "en" ? "Writing" : "Yazılar"
      );
    }
  );

  it("marks the post detail page openGraph type as article with its published time", async () => {
    const postPage = PAGES.find(
      (page) => page.name === "blog/coolify-ile-kendi-sunucumda [tr]"
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

  it("gives a bilingual post en, tr and x-default in its alternates", async () => {
    const postPage = PAGES.find(
      (page) => page.name === "blog/capt-sinavina-hazirlik [tr]"
    );
    if (!postPage) {
      throw new Error("no turkish case for the bilingual post");
    }

    const metadata = await metadataFor(postPage, "tr");
    const languages = metadata.alternates?.languages as
      Record<string, string> | undefined;

    expect(Object.keys(languages ?? {}).sort()).toEqual([
      "en",
      "tr",
      "x-default",
    ]);
  });

  it.each(["coming-soon", "updating"] as const)(
    "%s is not indexed",
    async (name) => {
      const page = PAGES.find((entry) => entry.name === name);
      if (!page) throw new Error(`no ${name} page case found`);
      const metadata = await metadataFor(page, "en");
      expect(metadata.robots).toEqual({ index: false, follow: false });
    }
  );
});
