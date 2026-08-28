import { describe, expect, it } from "vitest";
import {
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

describe("project content layer", () => {
  it("returns only english projects for the en locale", () => {
    const list = getProjects("en");
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((project) => project.locale === "en")).toBe(true);
  });

  it("sorts projects by order ascending", () => {
    const orders = getProjects("en").map((project) => project.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it("finds cargo-pilot by slug", () => {
    const project = getProject("en", "cargo-pilot");
    expect(project?.title).toBe("Cargo Pilot");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProject("en", "does-not-exist")).toBeUndefined();
  });

  it("lists the locales a slug is translated into", () => {
    expect(getProjectLocales("cargo-pilot")).toEqual(["en", "tr"]);
    expect(getProjectLocales("does-not-exist")).toEqual([]);
  });

  it("builds a locale neutral href in the card dto", () => {
    const project = getProject("en", "cargo-pilot")!;
    const card = toProjectCardData(project);
    expect(card.href).toBe("/projects/cargo-pilot");
    expect(card.title).toBe("Cargo Pilot");
    expect(card.liveUrl).toBe("https://cargopilot.divizyon.org");
    expect(card.repoUrl).toBeNull();
    expect(card.cover).toBeNull();
  });

  it("never returns a slug that is not a valid url segment", () => {
    for (const slug of getProjectSlugs("en")) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});

describe("post content layer", () => {
  it("has three turkish posts and three english posts sorted newest first", () => {
    const trPosts = getPosts("tr");
    expect(trPosts.map((post) => post.slug)).toEqual([
      "self-hosting-with-coolify",
      "capt-sinavina-hazirlik",
      "ccna-dan-web-guvenligine",
    ]);

    const enPosts = getPosts("en");
    expect(enPosts.map((post) => post.slug)).toEqual([
      "self-hosting-with-coolify",
      "capt-sinavina-hazirlik",
      "ccna-dan-web-guvenligine",
    ]);
  });

  it("lists en and tr as the locales for the bilingual posts", () => {
    expect(getPostLocales("self-hosting-with-coolify")).toEqual(["en", "tr"]);
    expect(getPostLocales("capt-sinavina-hazirlik")).toEqual(["en", "tr"]);
    expect(getPostLocales("ccna-dan-web-guvenligine")).toEqual(["en", "tr"]);
  });

  it("lists no locales for a slug that does not exist", () => {
    expect(getPostLocales("nothing")).toEqual([]);
  });

  it("finds english translations for every published post slug", () => {
    expect(getPost("en", "capt-sinavina-hazirlik")?.locale).toBe("en");
    expect(getPost("en", "ccna-dan-web-guvenligine")?.locale).toBe("en");
  });

  it("builds a locale neutral href and reading time in the card dto", () => {
    const post = getPost("tr", "self-hosting-with-coolify")!;
    const card = toPostCardData(post);
    expect(card.href).toBe("/blog/self-hosting-with-coolify");
    expect(card.readingTime).toBeGreaterThanOrEqual(1);
    expect(card.date.startsWith("2026-08-20")).toBe(true);
  });
});

describe("untranslated paths", () => {
  it("has nothing untranslated for en because every project and post is bilingual", () => {
    expect(getUntranslatedPaths("en")).toEqual([]);
  });

  it("has nothing untranslated for tr because every project is bilingual", () => {
    expect(getUntranslatedPaths("tr")).toEqual([]);
  });
});
