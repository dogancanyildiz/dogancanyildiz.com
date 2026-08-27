"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useLocale } from "@/components/locale-provider";
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
  const { t } = useLocale();
  const title = t(`projects.items.${project.id}.title`);
  const description = t(`projects.items.${project.id}.description`);
  const compact = variant === "compact";
  const featured = variant === "featured";

  const content = (
    <Card className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
      <div className="h-28 bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--primary)_20%,transparent),transparent_55%),linear-gradient(135deg,color-mix(in_oklab,var(--accent)_50%,transparent),transparent)] sm:h-32" />
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {project.year}
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
            {title}
          </CardTitle>
          {project.summary ? (
            <p className="max-w-xl text-sm leading-6 text-foreground/75">
              {project.summary}
            </p>
          ) : null}
        </div>
        <span className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-background/75 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:text-foreground">
          <ArrowUpRight className="size-4" />
        </span>
      </CardHeader>
      <CardContent className={compact ? "space-y-4 pt-0" : "space-y-5 pt-0"}>
        <CardDescription>{description}</CardDescription>
        {project.impact ? (
          <p className="rounded-[1.25rem] border border-border/70 bg-background/55 px-4 py-3 text-sm leading-6 text-muted-foreground">
            {project.impact}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/65 bg-accent/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const wrapperClassName = featured
    ? "lg:[&_div[data-slot='card']]:min-h-[31rem]"
    : compact
      ? "lg:[&_div[data-slot='card']]:min-h-[14rem]"
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: "easeOut",
      }}
      className={wrapperClassName}
    >
      <Link href={`/projects/${project.slug}`} className="block h-full">
        {content}
      </Link>
    </motion.div>
  );
}
