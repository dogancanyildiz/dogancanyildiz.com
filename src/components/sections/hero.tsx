"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { ArrowRight, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { staggerContainer, staggerItem, MOTION_ITEM_CLASS } from "@/lib/motion";
import { CV_PATH } from "@/lib/site";

interface HeroProps {
  showCv: boolean;
  profileImageSrc?: string | null;
}

export function Hero({ showCv, profileImageSrc }: HeroProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const container = staggerContainer(reduced);
  const item = staggerItem(reduced);

  return (
    <section className="section-space">
      <div className="page-shell">
        <m.div
          variants={container}
          initial="hidden"
          animate="show"
          className={`max-w-3xl space-y-8 ${MOTION_ITEM_CLASS}`}
        >
          <m.div variants={item} className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="eyebrow">{t("hero.location")}</span>
            <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-status-up" />
              {t("hero.availableForWork")}
            </span>
          </m.div>

          <m.div variants={item} className="space-y-4">
            <div className="flex items-start gap-4">
              {profileImageSrc ? (
                <ProfileAvatar
                  src={profileImageSrc}
                  alt={t("brand.name")}
                  sizeClass="size-14 sm:size-16"
                />
              ) : null}
              <div className="min-w-0 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("brand.name")} · {t("brand.role")}
                </p>
                <h1 className="page-title text-balance">{t("hero.tagline")}</h1>
                <p className="max-w-2xl section-copy">{t("hero.intro")}</p>
              </div>
            </div>
          </m.div>

          <m.div
            variants={item}
            className="metric-strip"
          >
            <div className="metric-cell">
              <p className="meta-label">{t("hero.metricYearsLabel")}</p>
              <p className="mt-1 font-mono text-2xl font-medium tabular-nums text-foreground sm:text-3xl">
                <Link
                  href="/about"
                  className="text-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  {t("hero.metricYearsValue")}
                </Link>
              </p>
            </div>
            <div className="metric-cell">
              <p className="meta-label">{t("hero.metricProjectsLabel")}</p>
              <p className="mt-1 font-mono text-2xl font-medium tabular-nums text-foreground sm:text-3xl">
                <Link
                  href="/projects"
                  className="text-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  {t("hero.metricProjectsValue")}
                </Link>
              </p>
            </div>
            <div className="metric-cell">
              <p className="meta-label">{t("hero.metricFocusLabel")}</p>
              <p className="mt-1 text-sm font-medium leading-snug text-foreground sm:text-base">
                {t("hero.metricFocusValue")}
              </p>
            </div>
          </m.div>

          <m.div variants={item} className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/projects">
                {t("hero.viewProjects")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">{t("hero.getInTouch")}</Link>
            </Button>
            {showCv ? (
              <Button asChild variant="ghost" size="lg">
                <a href={CV_PATH} download>
                  <Download className="size-4" />
                  {t("hero.downloadCv")}
                </a>
              </Button>
            ) : null}
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
