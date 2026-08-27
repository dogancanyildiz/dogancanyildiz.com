"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { ArrowRight, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { CV_PATH } from "@/lib/site";

interface HeroProps {
  showCv: boolean;
}

export function Hero({ showCv }: HeroProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const container = staggerContainer(reduced);
  const item = staggerItem(reduced);

  return (
    <section className="section-space relative overflow-hidden pt-10 sm:pt-14">
      <div className="page-shell">
        <m.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-3xl space-y-8"
        >
          <m.span variants={item} className="eyebrow">
            {t("hero.location")}
          </m.span>

          <m.div variants={item} className="space-y-5">
            <p className="font-mono text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("brand.name")} · {t("brand.role")}
            </p>
            <h1 className="max-w-3xl text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
              {t("hero.tagline")}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {t("hero.intro")}
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
