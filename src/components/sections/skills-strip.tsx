"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import type { SkillGroup } from "@/content/profile";
import { SkillCategoryList } from "@/components/sections/skill-group-grid";
import { PageHeader } from "@/components/ui/page-header";
import { fadeUp, MOTION_ITEM_CLASS } from "@/lib/motion";

interface SkillsStripProps {
  groups: SkillGroup[];
}

export function SkillsStrip({ groups }: SkillsStripProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);

  return (
    <div className="space-y-8">
      <m.div variants={variants} initial="hidden" animate="show" custom={0}>
        <PageHeader
          as="h2"
          eyebrow={t("home.skillsEyebrow")}
          title={t("home.skillsTitle")}
          description={t("home.skillsSubtitle")}
        />
      </m.div>

      <m.div
        variants={variants}
        initial="hidden"
        animate="show"
        custom={1}
        className={MOTION_ITEM_CLASS}
      >
        <SkillCategoryList groups={groups} />
      </m.div>
    </div>
  );
}
