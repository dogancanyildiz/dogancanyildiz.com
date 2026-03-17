"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div variants={item} className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
              <span className="size-1.5 rounded-full bg-green-500" />
              {t("hero.availableForWork")}
            </span>
          </motion.div>

          <motion.p
            variants={item}
            className="text-sm font-medium text-primary sm:text-base"
          >
            {t("hero.greeting")} {t("hero.name")}
          </motion.p>
          <motion.p
            variants={item}
            className="text-base text-muted-foreground sm:text-lg"
          >
            {t("hero.role")}
          </motion.p>
          <motion.h1
            variants={item}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            {t("hero.title")}
          </motion.h1>
          <motion.p
            variants={item}
            className="mx-auto max-w-xl text-lg text-muted-foreground"
          >
            {t("hero.subtitle")}
          </motion.p>
          <motion.div
            variants={item}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Button asChild size="lg">
              <Link href="/projects">{t("hero.viewProjects")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">{t("hero.contact")}</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href="/cv.pdf" download>
                <Download className="mr-2 size-4" />
                {t("hero.downloadCV")}
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
