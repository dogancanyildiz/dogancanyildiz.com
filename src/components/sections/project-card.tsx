"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { fadeUp } from "@/lib/motion";
import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
  index: number;
  variant?: "featured" | "standard" | "compact";
}

export function ProjectCard({
  project,
  index,
  variant = "standard",
}: ProjectCardProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
  const title = t(`projects.items.${project.id}.title`);
  const description = t(`projects.items.${project.id}.description`);
  const compact = variant === "compact";
  const featured = variant === "featured";

  const wrapperClassName = featured
    ? "lg:[&_div[data-slot='card']]:min-h-[31rem]"
    : compact
      ? "lg:[&_div[data-slot='card']]:min-h-[14rem]"
      : "";

  return (
    <m.div
      variants={variants}
      initial="hidden"
      animate="show"
      custom={index}
      className={wrapperClassName}
    >
      {/* The whole card is clickable through the title link's ::after overlay,
          so the card itself stays a plain container and can host extra links
          (repo, live site) without nesting interactive elements. */}
      <Card className="group relative h-full overflow-hidden transition-colors hover:border-primary">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                {project.year ?? ""}
              </span>
              {project.highlight ? (
                <span className="text-xs font-medium text-primary">
                  {project.highlight}
                </span>
              ) : null}
            </div>
            <CardTitle
              className={
                featured
                  ? "text-3xl sm:text-4xl"
                  : compact
                    ? "text-xl"
                    : "text-2xl"
              }
            >
              <Link
                href={`/projects/${project.slug}`}
                className="text-foreground no-underline transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
              >
                {title}
              </Link>
            </CardTitle>
            {project.summary ? (
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                {project.summary}
              </p>
            ) : null}
          </div>
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors group-hover:text-foreground"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </CardHeader>
        <CardContent className={compact ? "space-y-4 pt-0" : "space-y-5 pt-0"}>
          <CardDescription>{description}</CardDescription>
          {project.impact ? (
            <p className="rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm leading-6 text-muted-foreground">
              {project.impact}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-muted px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}
