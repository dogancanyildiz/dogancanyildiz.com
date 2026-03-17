"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/components/locale-provider";
import { skillCategories } from "@/data/skills";

export function SkillsStrip() {
  const { t } = useLocale();

  return (
    <section className="border-t border-border/40 bg-muted/30 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-sm font-medium text-muted-foreground"
        >
          {t("home.skillsTitle")}
        </motion.p>
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
          {skillCategories.map((category, catIndex) => (
            <motion.div
              key={category.labelKey}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {t(category.labelKey)}
              </span>
              <ul className="flex flex-wrap justify-center gap-2">
                {category.skills.map((skill, i) => (
                  <motion.li
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: catIndex * 0.1 + i * 0.05 }}
                  >
                    <span className="rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium text-foreground shadow-xs">
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
