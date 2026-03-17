"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl">
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
          className="space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {project.year && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                {project.year}
              </span>
            )}
          </div>

          <p className="text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>

          {(project.githubUrl || project.liveUrl) && (
            <div className="flex flex-wrap gap-3 pt-2">
              {project.liveUrl && (
                <Button asChild size="sm">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 size-4" />
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
                    <Github className="mr-2 size-4" />
                    {t("projects.viewSource")}
                  </a>
                </Button>
              )}
            </div>
          )}

          <div className="border-t border-border/40 pt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("projects.technologies")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
