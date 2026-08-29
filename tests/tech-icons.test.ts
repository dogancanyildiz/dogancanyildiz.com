import { readFileSync } from "node:fs";
import { join } from "node:path";
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

describe("inline icon svg props", () => {
  const read = (path: string) =>
    readFileSync(join(process.cwd(), path), "utf8");

  it("types the brand icons over the whole svg surface", () => {
    // Callers pass aria-hidden. JSX exempts hyphenated attribute names from
    // excess property checks, so a className-only props type accepted it and
    // then dropped it.
    const source = read("src/components/ui/brand-icon.tsx");
    expect(source).toContain("SVGProps<SVGSVGElement>");
    expect(source).toMatch(/\{\.\.\.props\}/);
  });

  it("leaves role=img off decorative marks", () => {
    for (const path of [
      "src/components/ui/brand-icon.tsx",
      "src/components/ui/skill-tag.tsx",
    ]) {
      const source = read(path);
      expect(source, path).toContain('aria-hidden="true"');
      expect(source, path).not.toContain('role="img"');
    }
  });
});
