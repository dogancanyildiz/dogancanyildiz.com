import type { SkillGroup } from "@/content/profile";

export function sortSkillGroups(groups: SkillGroup[]): SkillGroup[] {
  return [...groups].sort((a, b) => a.order - b.order);
}

export function featuredSkillGroups(groups: SkillGroup[]): SkillGroup[] {
  return sortSkillGroups(groups.filter((group) => group.featured));
}

export function formatCategoryIndex(order: number): string {
  return String(order).padStart(2, "0");
}
