"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useLocale } from "@/components/locale-provider";
import { ProjectCard } from "./project-card";
import { projects, featuredProjectIds } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

const featured = featuredProjectIds
  .map((id) => projects.find((p) => p.id === id))
  .filter(Boolean) as typeof projects;

export function FeaturedProjects() {
  const { t } = useLocale();
  const [lead, ...rest] = featured;

  return (
    <section className="section-space">
      <div className="page-shell space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionHeading
            eyebrow={t("home.featuredEyebrow")}
            title={t("home.featuredTitle")}
            description={t("home.featuredSubtitle")}
            action={
              <Button asChild variant="outline" size="lg">
                <Link href="/projects">{t("home.viewAll")}</Link>
              </Button>
            }
          />
        </motion.div>
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {lead ? (
            <ProjectCard project={lead} index={0} variant="featured" />
          ) : null}
          <div className="grid gap-6">
            {rest.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index + 1}
                variant="compact"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
