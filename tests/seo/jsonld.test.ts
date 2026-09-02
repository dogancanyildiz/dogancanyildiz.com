import { beforeEach, describe, expect, it, vi } from "vitest";
import { routing } from "@/i18n/routing";
import {
  buildBlogPosting,
  buildBreadcrumbList,
  buildProjectCreativeWork,
  buildWebSite,
  identityUrl,
  personId,
  personRef,
  websiteId,
} from "@/lib/seo/jsonld";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dogancanyildiz.com");
});

describe("identity nodes", () => {
  it("gives the person one id and one url, independent of locale", () => {
    expect(personId()).toBe("https://dogancanyildiz.com/#person");
    expect(identityUrl()).toBe("https://dogancanyildiz.com/");
  });

  it("references the person by id everywhere it is used", () => {
    const reference = personRef();

    expect(reference["@id"]).toBe(personId());
    expect(reference["@type"]).toBe("Person");
    // Repeated alongside the id for a consumer that does not resolve
    // references.
    expect(reference.name).toBeTruthy();
    expect(reference.url).toBe(identityUrl());
  });

  it("describes one website per locale under a single id", () => {
    const ids = routing.locales.map((locale) => {
      const site = buildWebSite(locale, "Name", "Description");
      expect(site["@type"]).toBe("WebSite");
      expect(site.inLanguage).toBe(locale);
      expect(site.publisher).toEqual(personRef());
      return site["@id"];
    });

    expect(new Set(ids).size).toBe(1);
    expect(ids[0]).toBe(websiteId());
  });

  it("gives that one website id a single url, whichever locale renders it", () => {
    // A node id is a claim about identity. Handing the same @id a different
    // url per locale is the split identity the shared id exists to prevent;
    // the language of the page is carried by inLanguage instead.
    for (const locale of routing.locales) {
      expect(buildWebSite(locale, "Name", "Description").url).toBe(
        identityUrl()
      );
    }
  });
});

describe("buildBreadcrumbList", () => {
  it("numbers the trail from one and links every step but the last", () => {
    const crumb = buildBreadcrumbList("tr", [
      { name: "Yazılar", path: "/blog" },
      { name: "Bir yazı", path: "/blog/bir-yazi" },
    ]) as { itemListElement: Array<Record<string, unknown>> };

    expect(crumb.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Yazılar",
        item: "https://dogancanyildiz.com/blog",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Bir yazı",
      },
    ]);
  });
});

describe("blog posting schema", () => {
  it.each([...routing.locales])(
    "names the author, the publisher and an image for every %s post",
    async (locale) => {
      const { getPosts } = await import("@/lib/content");
      const posts = getPosts(locale);
      expect(posts.length).toBeGreaterThan(0);

      for (const post of posts) {
        const data = buildBlogPosting(locale, post);

        expect(data["@type"]).toBe("BlogPosting");
        expect(data.author).toEqual(personRef());
        // One human wrote and published it: the same node, not two.
        expect(data.publisher).toEqual(data.author);
        // The post's own card, not the identity one: the page's og:image
        // points here too, and a consumer handed two different images for the
        // same page has no way to pick.
        const prefix = locale === "en" ? "/en" : "";
        expect(data.image).toBe(
          `https://dogancanyildiz.com${prefix}/blog/${post.slug}/opengraph-image/default`
        );
        expect(data.inLanguage).toBe(locale);
        expect(data.datePublished).toBe(post.date);
        expect(data.dateModified).toBe(post.updated ?? post.date);
      }
    }
  );

  it("prefers updated over the publish date once frontmatter sets it", async () => {
    const { getPosts } = await import("@/lib/content");
    const [firstPost] = getPosts("en");
    if (!firstPost) {
      throw new Error("the en blog collection is empty");
    }
    const post = { ...firstPost, updated: "2026-08-27" };

    const data = buildBlogPosting("en", post);

    expect(data.dateModified).toBe("2026-08-27");
    expect(data.datePublished).toBe(post.date);
    expect(data.dateModified).not.toBe(data.datePublished);
  });
});

describe("project schema", () => {
  it("uses the same creator node as the post author", async () => {
    const { getProjects } = await import("@/lib/content");

    for (const project of getProjects("en")) {
      const data = buildProjectCreativeWork("en", project);

      expect(data["@type"]).toBe("CreativeWork");
      expect((data.creator as Record<string, unknown>)["@id"]).toBe(personId());
      expect(data.url).toBe(
        `https://dogancanyildiz.com/en/projects/${project.slug}`
      );
      // Same card the page advertises as og:image.
      expect(data.image).toBe(
        `https://dogancanyildiz.com/en/projects/${project.slug}/opengraph-image/default`
      );
      // No updated field means no dateModified at all, rather than a repeat
      // of the creation year.
      expect("dateModified" in data).toBe(Boolean(project.updated));
    }
  });
});
