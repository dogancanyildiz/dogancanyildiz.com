"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProjectCard } from "./project-card";
import { projects, featuredProjectIds } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { fadeUp } from "@/lib/motion";

const featured = featuredProjectIds
  .map((id) => projects.find((p) => p.id === id))
  .filter(Boolean) as typeof projects;

export function FeaturedProjects() {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
  const [lead, ...rest] = featured;

  return (
    <section className="section-space">
      <div className="page-shell space-y-10">
        <m.div variants={variants} initial="hidden" animate="show" custom={0}>
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
        </m.div>
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
