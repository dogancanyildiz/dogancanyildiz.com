import { describe, expect, it } from "vitest";
import { skills } from "@/content/profile";
import {
  featuredSkillGroups,
  formatCategoryIndex,
  sortSkillGroups,
} from "@/lib/skills";
import { skillIconFor } from "@/lib/tech-icons";

const LOCALES = ["en", "tr"] as const;

describe("tech icons", () => {
  it("maps common profile skill labels to brand icons", () => {
    for (const label of [
      "TypeScript",
      "Next.js",
      "Docker",
      "GitHub Actions",
      "Coolify",
    ]) {
      expect(skillIconFor(label)?.title.length).toBeGreaterThan(0);
    }
  });

  it("returns null for labels that are concepts, not products", () => {
    expect(skillIconFor("RESTful API design")).toBeNull();
    expect(skillIconFor("CI/CD pipelines")).toBeNull();
  });

  it("covers most featured home-page skill items with logos", () => {
    const featured = featuredSkillGroups(skills.en);
    const labels = featured.flatMap((group) => group.items);
    const withIcons = labels.filter((label) => skillIconFor(label) !== null);
    expect(withIcons.length / labels.length).toBeGreaterThan(0.5);
  });
});

describe("skill categories", () => {
  it("keeps stable ids and order values across locales", () => {
    for (const locale of LOCALES) {
      const ordered = sortSkillGroups(skills[locale]);
      expect(ordered.map((group) => group.id)).toEqual([
        "frontend",
        "backend",
        "databases",
        "devops",
        "security",
        "networking",
        "ways-of-working",
        "other",
      ]);
      expect(ordered.map((group) => group.order)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8,
      ]);
    }
  });

  it("shows five ordered stack categories on the home page", () => {
    const featured = featuredSkillGroups(skills.en);
    expect(featured.map((group) => group.id)).toEqual([
      "frontend",
      "backend",
      "databases",
      "devops",
      "security",
    ]);
  });

  it("formats category indices with a leading zero", () => {
    expect(formatCategoryIndex(1)).toBe("01");
    expect(formatCategoryIndex(8)).toBe("08");
  });
});
