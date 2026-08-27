"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { Project } from "@/data/projects";
import { fadeUp } from "@/lib/motion";

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
  const title = t(`projects.items.${project.id}.title`);
  const description = t(`projects.items.${project.id}.description`);

  return (
    <section className="section-space">
      <div className="page-shell-reading space-y-10">
        <m.div variants={variants} initial="hidden" animate="show" custom={0}>
          <Link
            href="/projects"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("projects.backToProjects")}
          </Link>
        </m.div>

        <m.div
          variants={variants}
          initial="hidden"
          animate="show"
          custom={1}
          className="surface-panel space-y-8 overflow-hidden p-6 sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-3">
                  {project.year ? (
                    <span className="eyebrow">{project.year}</span>
                  ) : null}
                  <h1 className="text-4xl leading-tight sm:text-5xl">
                    {title}
                  </h1>
                </div>
              </div>

              <p className="text-lg leading-8 text-muted-foreground">
                {description}
              </p>

              {project.summary ? (
                <div className="rounded-[1.5rem] border border-border bg-background p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("projects.summary")}
                  </p>
                  <p className="text-sm leading-7 text-foreground/80">
                    {project.summary}
                  </p>
                </div>
              ) : null}

              {project.impact ? (
                <div className="rounded-[1.5rem] border border-border bg-background p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("projects.impact")}
                  </p>
                  <p className="text-sm leading-7 text-foreground/80">
                    {project.impact}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              {project.role ? (
                <div className="rounded-[1.5rem] border border-border bg-background p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("projects.role")}
                  </p>
                  <p className="text-sm leading-7 text-foreground/80">
                    {project.role}
                  </p>
                </div>
              ) : null}

              {(project.githubUrl || project.liveUrl) && (
                <div className="rounded-[1.5rem] border border-border bg-background p-5">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("projects.links")}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {project.liveUrl && (
                      <Button asChild size="sm">
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-4" />
                          {t("projects.viewLive")}
                        </a>
                      </Button>
                    )}
                    {project.githubUrl && (
                      <Button asChild variant="outline" size="sm">
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Github className="size-4" />
                          {t("projects.viewSource")}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-[1.5rem] border border-border bg-background p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("projects.technologies")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/85"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}
