"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "@/components/locale-provider";
import { skillCategories } from "@/data/skills";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {t("about.title")}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="space-y-6 text-muted-foreground"
        >
          <p className="leading-relaxed">{t("about.intro")}</p>
          <p className="leading-relaxed">{t("about.p1")}</p>
          <p className="leading-relaxed">{t("about.p2")}</p>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4 mt-12 text-xl font-semibold text-foreground"
        >
          {t("about.skillsTitle")}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="mb-12 space-y-4"
        >
          {skillCategories.map((category) => (
            <div key={category.labelKey}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {t(category.labelKey)}
              </p>
              <ul className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-xl font-semibold text-foreground"
        >
          {t("about.experienceTitle")}
        </motion.h2>
        <ul className="mb-12 space-y-8 border-l-2 border-border pl-6">
          <motion.li
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative -left-[1.625rem] flex flex-col gap-1"
          >
            <span className="absolute left-0 h-3 w-3 rounded-full bg-primary" />
            <span className="font-semibold text-foreground">{t("about.exp1Role")}</span>
            <span className="text-sm text-muted-foreground">
              {t("about.exp1Company")} · {t("about.exp1Period")}
            </span>
            <p className="text-sm text-muted-foreground">{t("about.exp1Desc")}</p>
          </motion.li>
          <motion.li
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative -left-[1.625rem] flex flex-col gap-1"
          >
            <span className="absolute left-0 h-3 w-3 rounded-full bg-primary" />
            <span className="font-semibold text-foreground">{t("about.exp2Role")}</span>
            <span className="text-sm text-muted-foreground">
              {t("about.exp2Company")} · {t("about.exp2Period")}
            </span>
            <p className="text-sm text-muted-foreground">{t("about.exp2Desc")}</p>
          </motion.li>
          <motion.li
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative -left-[1.625rem] flex flex-col gap-1"
          >
            <span className="absolute left-0 h-3 w-3 rounded-full bg-primary" />
            <span className="font-semibold text-foreground">{t("about.exp3Role")}</span>
            <span className="text-sm text-muted-foreground">
              {t("about.exp3Company")} · {t("about.exp3Period")}
            </span>
            <p className="text-sm text-muted-foreground">{t("about.exp3Desc")}</p>
          </motion.li>
        </ul>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-xl font-semibold text-foreground"
        >
          {t("about.educationTitle")}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative -left-[1.625rem] border-l-2 border-border pl-6"
        >
          <span className="absolute left-0 h-3 w-3 rounded-full bg-primary" />
          <span className="font-semibold text-foreground">{t("about.edu1Degree")}</span>
          <span className="block text-sm text-muted-foreground">{t("about.edu1School")}</span>
          <span className="block text-sm text-muted-foreground">{t("about.edu1Period")}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <Button asChild variant="outline">
            <a href="/cv.pdf" download>
              <Download className="mr-2 size-4" />
              {t("about.downloadCV")}
            </a>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 text-muted-foreground"
        >
          {t("about.browseIntro")}{" "}
          <Link href="/projects" className="text-primary underline-offset-4 hover:underline">
            {t("about.projectsLink")}
          </Link>
          {t("about.or")}
          <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
            {t("about.contactLink")}
          </Link>
          .
        </motion.p>
      </div>
    </section>
  );
}
