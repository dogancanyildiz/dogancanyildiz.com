"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useLocale } from "@/components/locale-provider";
import { skillCategories } from "@/data/skills";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

export default function AboutPage() {
  const { t } = useLocale();

  return (
    <section className="section-space">
      <div className="page-shell-narrow space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <SectionHeading
            eyebrow={t("about.eyebrow")}
            title={t("about.title")}
            description={t("about.intro")}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="surface-panel space-y-6 p-6 sm:p-8"
        >
          <span className="eyebrow">{t("about.manifestoEyebrow")}</span>
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl">
              {t("about.manifestoTitle")}
            </h2>
            <p className="section-copy">{t("about.manifestoBody")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5 leading-7 text-muted-foreground">
              {t("about.p1")}
            </p>
            <p className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5 leading-7 text-muted-foreground">
              {t("about.p2")}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="space-y-6"
        >
          <SectionHeading
            eyebrow={t("about.capabilitiesEyebrow")}
            title={t("about.skillsTitle")}
          />
          {skillCategories.map((category) => (
            <div key={category.labelKey} className="surface-panel p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                {t(category.labelKey)}
              </p>
              <ul className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <SectionHeading
          eyebrow={t("about.timelineEyebrow")}
          title={t("about.experienceTitle")}
        />
        <ul className="space-y-5">
          <motion.li
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="surface-panel relative overflow-hidden p-6"
          >
            <span className="absolute left-0 top-0 h-full w-1 bg-primary" />
            <span className="font-semibold text-foreground">
              {t("about.exp1Role")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("about.exp1Company")} · {t("about.exp1Period")}
            </span>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t("about.exp1Desc")}
            </p>
          </motion.li>
          <motion.li
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="surface-panel relative overflow-hidden p-6"
          >
            <span className="absolute left-0 top-0 h-full w-1 bg-primary" />
            <span className="font-semibold text-foreground">
              {t("about.exp2Role")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("about.exp2Company")} · {t("about.exp2Period")}
            </span>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t("about.exp2Desc")}
            </p>
          </motion.li>
          <motion.li
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="surface-panel relative overflow-hidden p-6"
          >
            <span className="absolute left-0 top-0 h-full w-1 bg-primary" />
            <span className="font-semibold text-foreground">
              {t("about.exp3Role")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("about.exp3Company")} · {t("about.exp3Period")}
            </span>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {t("about.exp3Desc")}
            </p>
          </motion.li>
        </ul>

        <SectionHeading
          eyebrow={t("about.educationEyebrow")}
          title={t("about.educationTitle")}
        />
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="surface-panel relative overflow-hidden p-6"
        >
          <span className="absolute left-0 top-0 h-full w-1 bg-primary" />
          <span className="font-semibold text-foreground">
            {t("about.edu1Degree")}
          </span>
          <span className="block text-sm text-muted-foreground">
            {t("about.edu1School")}
          </span>
          <span className="block text-sm text-muted-foreground">
            {t("about.edu1Period")}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center gap-4"
        >
          <Button asChild variant="outline" size="lg">
            <a href="/cv.pdf" download>
              <Download className="size-4" />
              {t("about.downloadCV")}
            </a>
          </Button>
          <Button asChild size="lg">
            <Link href="/projects">{t("about.projectsLink")}</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-muted-foreground"
        >
          {t("about.browseIntro")}{" "}
          <Link
            href="/projects"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("about.projectsLink")}
          </Link>
          {t("about.or")}
          <Link
            href="/contact"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("about.contactLink")}
          </Link>
          .
        </motion.p>
      </div>
    </section>
  );
}
