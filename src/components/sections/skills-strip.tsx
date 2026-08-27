"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import type { SkillGroup } from "@/content/profile";
import { SectionHeading } from "@/components/ui/section-heading";
import { fadeUp } from "@/lib/motion";

interface SkillsStripProps {
  groups: SkillGroup[];
}

export function SkillsStrip({ groups }: SkillsStripProps) {
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
          {groups.map((group, groupIndex) => (
            <m.div
              key={group.title}
              variants={variants}
              initial="hidden"
              animate="show"
              custom={groupIndex}
              className="surface-panel flex flex-col gap-5 p-6"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                {group.title}
              </span>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item}>
                    <span className="inline-flex rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground">
                      {item}
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
