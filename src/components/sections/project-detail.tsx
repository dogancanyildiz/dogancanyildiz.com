"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/locale-provider";
import type { Project } from "@/data/projects";

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const { t } = useLocale();
  const title = t(`projects.items.${project.id}.title`);
  const description = t(`projects.items.${project.id}.description`);

  return (
    <section className="section-space">
      <div className="page-shell-reading space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link
            href="/projects"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("projects.backToProjects")}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="surface-panel space-y-8 overflow-hidden p-6 sm:p-8"
        >
          <div className="h-32 rounded-[1.75rem] bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--primary)_22%,transparent),transparent_55%),linear-gradient(135deg,color-mix(in_oklab,var(--accent)_42%,transparent),transparent)]" />
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
                <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("projects.summary")}
                  </p>
                  <p className="text-sm leading-7 text-foreground/80">
                    {project.summary}
                  </p>
                </div>
              ) : null}

              {project.impact ? (
                <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
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
                <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("projects.role")}
                  </p>
                  <p className="text-sm leading-7 text-foreground/80">
                    {project.role}
                  </p>
                </div>
              ) : null}

              {(project.githubUrl || project.liveUrl) && (
                <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
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

              <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("projects.technologies")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border/70 bg-accent/45 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/85"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
