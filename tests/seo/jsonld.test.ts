import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { certificates } from "@/content/profile";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import {
  buildBlogPosting,
  buildBreadcrumbList,
  buildCollectionPage,
  buildCredentials,
  buildItemList,
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
        item: "https://dogancanyildiz.com/yazilar",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Bir yazı",
      },
    ]);
  });
});

describe("buildItemList", () => {
  it("numbers the entries from one, in order, each with its own url", () => {
    const list = buildItemList([
      { name: "First", url: "https://dogancanyildiz.com/yazilar/first" },
      { name: "Second", url: "https://dogancanyildiz.com/yazilar/second" },
    ]);

    expect(list["@type"]).toBe("ItemList");
    expect(list.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "First",
        url: "https://dogancanyildiz.com/yazilar/first",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Second",
        url: "https://dogancanyildiz.com/yazilar/second",
      },
    ]);
  });
});

describe("buildCollectionPage", () => {
  it("wraps the visible listing as an ItemList tied back to the website node", () => {
    const page = buildCollectionPage("tr", {
      name: "Yazılar",
      description: "Yazdıklarım",
      url: "https://dogancanyildiz.com/yazilar",
      items: [
        {
          name: "Bir yazı",
          url: "https://dogancanyildiz.com/yazilar/bir-yazi",
        },
      ],
    });

    expect(page["@type"]).toBe("CollectionPage");
    // The page is its own node and part of the shared WebSite, referenced by
    // id rather than repeated.
    expect(page["@id"]).toBe("https://dogancanyildiz.com/yazilar");
    expect(page.url).toBe("https://dogancanyildiz.com/yazilar");
    expect(page.inLanguage).toBe("tr");
    expect(page.isPartOf).toEqual({ "@id": websiteId() });
    // name and description are the page's own heading and lead, both visible.
    expect(page.name).toBe("Yazılar");
    expect(page.description).toBe("Yazdıklarım");

    const list = page.mainEntity as Record<string, unknown>;
    expect(list["@type"]).toBe("ItemList");
    expect(list.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Bir yazı",
        url: "https://dogancanyildiz.com/yazilar/bir-yazi",
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

      const { ogImageHref } = await import("@/i18n/navigation");
      const { contentUrl } = await import("@/lib/seo/alternates");

      for (const post of posts) {
        const data = buildBlogPosting(locale, post);

        expect(data["@type"]).toBe("BlogPosting");
        expect(data.author).toEqual(personRef());
        // One human wrote and published it: the same node, not two.
        expect(data.publisher).toEqual(data.author);
        // The post's own card, not the identity one: the page's og:image
        // points here too, and a consumer handed two different images for the
        // same page has no way to pick. Locale localized, since a Turkish
        // post now lives under /yazilar rather than /blog.
        expect(data.image).toBe(
          `https://dogancanyildiz.com${ogImageHref(locale, "post", post.slug)}`
        );
        expect(data.mainEntityOfPage).toEqual({
          "@type": "WebPage",
          "@id": contentUrl(locale, "post", post.slug),
        });
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

describe("buildCredentials", () => {
  it("describes every certificate the About page lists", () => {
    for (const locale of routing.locales) {
      const credentials = buildCredentials(locale);

      expect(credentials).toHaveLength(certificates[locale].length);
      for (const [index, node] of credentials.entries()) {
        const entry = certificates[locale][index];
        expect(node["@type"]).toBe("EducationalOccupationalCredential");
        expect(node.name).toBe(entry?.name);
        expect(node.recognizedBy).toEqual({
          "@type": "Organization",
          name: entry?.issuer,
        });
        expect(["certificate", "badge"]).toContain(node.credentialCategory);
      }
    }
  });

  it("carries a url only where the issuer publishes one to check", () => {
    for (const node of buildCredentials("en")) {
      if (!("url" in node)) continue;
      expect(node.url).toMatch(/^https:\/\//);
    }
    // The Global AI Hub record has neither a working verification page nor a
    // date. A url pointing back at this site's own About section would claim
    // a check that does not exist.
    const orphan = buildCredentials("en").find(
      (node) => node.name === "Version Control Systems and Portfolio"
    );
    expect(orphan).toBeDefined();
    expect("url" in (orphan ?? {})).toBe(false);
    expect("dateCreated" in (orphan ?? {})).toBe(false);
  });

  it("dates a credential with the day printed on it", () => {
    const capt = buildCredentials("tr").find((node) =>
      String(node.name).includes("CAPT")
    );

    expect(capt?.dateCreated).toBe("2025-06-01");
    expect(capt?.url).toBe("https://hackviser.com/verify?id=HV-CAPT-02TKGO4Q");
    expect(capt?.credentialCategory).toBe("certificate");
  });

  it("hangs the list off the Person node, not off each page", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/seo/person-jsonld.tsx"),
      "utf8"
    );

    expect(source).toContain("hasCredential");
    expect(source).toContain("buildCredentials(locale)");
  });
});

describe("Person node fields", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/seo/person-jsonld.tsx"),
    "utf8"
  );

  it("carries the fields with a visible counterpart on the page", () => {
    // knowsLanguage (the languages section), hasOccupation (the role line) and
    // email (the footer mailto) all have a visible home, so they ride on every
    // render.
    expect(source).toContain("knowsLanguage");
    expect(source).toContain("hasOccupation");
    expect(source).toContain("CONTACT_EMAIL_PUBLIC");
  });

  it("emits description only when a page passes its visible text", () => {
    // Structured text with no visible counterpart is hidden content, so the
    // description field is gated on the prop the About page supplies from its
    // own lead.
    expect(source).toMatch(/description \? \{ description \} : \{\}/);
  });

  it("keeps knowsLanguage as the real profile languages", () => {
    expect([...siteConfig.person.knowsLanguage]).toEqual(["tr", "en"]);
  });
});
