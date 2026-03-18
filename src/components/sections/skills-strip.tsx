"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/components/locale-provider";
import { skillCategories } from "@/data/skills";
import { SectionHeading } from "@/components/ui/section-heading";

export function SkillsStrip() {
  const { t } = useLocale();

  return (
    <section className="section-space pt-8">
      <div className="page-shell space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionHeading
            eyebrow={t("home.skillsEyebrow")}
            title={t("home.skillsTitle")}
            description={t("home.skillsSubtitle")}
          />
        </motion.div>
        <div className="grid gap-5 lg:grid-cols-3">
          {skillCategories.map((category, catIndex) => (
            <motion.div
              key={category.labelKey}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
              className="surface-panel flex flex-col gap-5 p-6"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                {t(category.labelKey)}
              </span>
              <ul className="flex flex-wrap gap-2">
                {category.skills.map((skill, i) => (
                  <motion.li
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: catIndex * 0.1 + i * 0.05 }}
                  >
                    <span className="inline-flex rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground">
                      {skill}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
