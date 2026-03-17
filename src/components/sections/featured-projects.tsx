"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "@/components/locale-provider";
import { ProjectCard } from "./project-card";
import { projects, featuredProjectIds } from "@/data/projects";
import { Button } from "@/components/ui/button";

const featured = featuredProjectIds
  .map((id) => projects.find((p) => p.id === id))
  .filter(Boolean) as typeof projects;

export function FeaturedProjects() {
  const { t } = useLocale();

  return (
    <section className="border-t border-border/40 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("home.featuredTitle")}
          </h2>
          <p className="mb-8 text-muted-foreground">
            {t("home.featuredSubtitle")}
          </p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Button asChild variant="outline" size="lg">
            <Link href="/projects">{t("home.viewAll")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
