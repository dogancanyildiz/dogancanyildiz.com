import { describe, expect, it } from "vitest";
import {
  getPost,
  getPostLocales,
  getPosts,
  getProject,
  getProjectLocales,
  getProjectSlugs,
  getProjects,
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
    expect(card.cover).toBeNull();
  });

  it("never returns a slug that is not a valid url segment", () => {
    for (const slug of getProjectSlugs("en")) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});

describe("post content layer", () => {
  it("has exactly one turkish post and no english posts yet", () => {
    const trPosts = getPosts("tr");
    expect(trPosts).toHaveLength(1);
    expect(trPosts[0]?.slug).toBe("self-hosting-with-coolify");
    expect(getPosts("en")).toEqual([]);
  });

  it("lists tr as the only locale for the first post", () => {
    expect(getPostLocales("self-hosting-with-coolify")).toEqual(["tr"]);
  });

  it("lists no locales for a slug that does not exist", () => {
    expect(getPostLocales("nothing")).toEqual([]);
  });

  it("finds no english translation of the turkish only post", () => {
    expect(getPost("en", "self-hosting-with-coolify")).toBeUndefined();
  });

  it("builds a locale neutral href and reading time in the card dto", () => {
    const post = getPost("tr", "self-hosting-with-coolify")!;
    const card = toPostCardData(post);
    expect(card.href).toBe("/blog/self-hosting-with-coolify");
    expect(card.readingTime).toBeGreaterThanOrEqual(1);
    expect(card.date.startsWith("2026-08-20")).toBe(true);
  });
});
