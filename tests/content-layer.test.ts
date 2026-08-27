import { describe, expect, it } from "vitest";
import {
  getPostLocales,
  getPosts,
  getProject,
  getProjectLocales,
  getProjectSlugs,
  getProjects,
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
  it("returns no posts yet for either locale", () => {
    expect(getPosts("en")).toEqual([]);
    expect(getPosts("tr")).toEqual([]);
  });

  it("lists no locales for a slug that does not exist", () => {
    expect(getPostLocales("nothing")).toEqual([]);
  });
});
