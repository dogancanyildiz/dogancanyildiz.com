import type { SkillGroup } from "@/content/profile";
import { sortSkillGroups } from "@/lib/skills";
import { SkillTag } from "@/components/ui/skill-tag";

interface SkillCategoryListProps {
  groups: SkillGroup[];
}

export function SkillCategoryList({ groups }: SkillCategoryListProps) {
  const ordered = sortSkillGroups(groups);

  return (
    <div className="skill-category-list">
      {ordered.map((group) => (
        <div key={group.id} className="skill-category">
          <h3 id={`skill-category-${group.id}`} className="meta-label">
            {group.title}
          </h3>
          <ul className="skill-item-list">
            {group.items.map((item) => (
              <li key={item}>
                <SkillTag label={item} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
