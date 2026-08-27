"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { ArrowRight, Download, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem } from "@/lib/motion";

export function Hero() {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const container = staggerContainer(reduced);
  const item = staggerItem(reduced);
  const highlights = [
    t("hero.focus1"),
    t("hero.focus2"),
    t("hero.focus3"),
    t("hero.focus4"),
  ];

  return (
    <section className="section-space relative overflow-hidden pt-10 sm:pt-14">
      <div className="page-shell">
        <m.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
        >
          <div className="space-y-8">
            <m.div variants={item} className="flex flex-wrap gap-3">
              <span className="eyebrow">
                <Sparkles className="size-3.5" />
                {t("hero.eyebrow")}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <span className="size-2 rounded-full bg-status-up" />
                {t("hero.availableForWork")}
              </span>
            </m.div>

            <m.div variants={item} className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary sm:text-base">
                {t("hero.greeting")} {t("hero.name")} · {t("hero.role")}
              </p>
              <h1 className="max-w-4xl text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
                {t("hero.title")}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                {t("hero.subtitle")}
              </p>
            </m.div>

            <m.div
              variants={item}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <Button asChild size="lg">
                <Link href="/projects">
                  {t("hero.viewProjects")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/contact">{t("hero.contact")}</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <a href="/cv.pdf" download>
                  <Download className="size-4" />
                  {t("hero.downloadCV")}
                </a>
              </Button>
            </m.div>
          </div>

          <m.aside
            variants={item}
            className="surface-panel relative overflow-hidden p-6 sm:p-8"
          >
            <div className="relative space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("hero.summaryTitle")}
                </p>
                <p className="text-base leading-7 text-foreground/85">
                  {t("hero.summaryBody")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[1.5rem] border border-border bg-background p-4">
                  <p className="font-mono text-3xl text-foreground">5+</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("hero.metricYears")}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border bg-background p-4">
                  <p className="font-mono text-3xl text-foreground">12</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("hero.metricProjects")}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border bg-background p-4">
                  <p className="font-mono text-3xl text-foreground">UI + FE</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("hero.metricFocus")}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("hero.focusLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-border bg-muted px-4 py-2 text-sm text-foreground"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("hero.note")}
              </p>
            </div>
          </m.aside>
        </m.div>
      </div>
    </section>
  );
}
