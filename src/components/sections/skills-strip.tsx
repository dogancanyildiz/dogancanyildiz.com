"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { skillCategories } from "@/data/skills";
import { SectionHeading } from "@/components/ui/section-heading";
import { fadeUp } from "@/lib/motion";

export function SkillsStrip() {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);

  return (
    <section className="section-space pt-8">
      <div className="page-shell space-y-10">
        <m.div variants={variants} initial="hidden" animate="show" custom={0}>
          <SectionHeading
            eyebrow={t("home.skillsEyebrow")}
            title={t("home.skillsTitle")}
            description={t("home.skillsSubtitle")}
          />
        </m.div>
        <div className="grid gap-5 lg:grid-cols-3">
          {skillCategories.map((category, catIndex) => (
            <m.div
              key={category.labelKey}
              variants={variants}
              initial="hidden"
              animate="show"
              custom={catIndex}
              className="surface-panel flex flex-col gap-5 p-6"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                {t(category.labelKey)}
              </span>
              <ul className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <li key={skill}>
                    <span className="inline-flex rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground">
                      {skill}
                    </span>
                  </li>
                ))}
              </ul>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
