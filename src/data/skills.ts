export interface SkillCategory {
  labelKey: string;
  skills: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    labelKey: "about.skillsFrontend",
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
  },
  {
    labelKey: "about.skillsBackend",
    skills: ["Node.js", "PostgreSQL"],
  },
  {
    labelKey: "about.skillsTools",
    skills: ["Git", "Figma"],
  },
];

export const skills = skillCategories.flatMap((c) => c.skills);
