"use client";

import * as m from "motion/react-m";
import { useReducedMotion, type Variants } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fadeUp } from "@/lib/motion";
import type { Project } from "@/data/projects";

interface ProjectRowProps {
  project: Project;
  index: number;
  variants?: Variants;
}

export function ProjectRow({ project, index, variants }: ProjectRowProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const rowVariants = variants ?? fadeUp(reduced);
  const title = t(`projects.items.${project.id}.title`);
  const stack = project.tags.slice(0, 4).join(" · ");

  return (
    <m.li
      variants={rowVariants}
      initial="hidden"
      animate="show"
      custom={index}
      className="group relative border-b border-border last:border-b-0"
    >
      <div className="grid items-baseline gap-x-6 gap-y-1 py-5 sm:grid-cols-[4rem_minmax(0,1fr)_minmax(0,13rem)]">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {project.year ?? ""}
        </span>
        <span className="min-w-0">
          <Link
            href={`/projects/${project.slug}`}
            className="text-lg text-foreground no-underline transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
          >
            {title}
          </Link>
          {project.role ? (
            <span className="mt-1 block truncate text-sm text-muted-foreground">
              {project.role}
            </span>
          ) : null}
        </span>
        <span className="truncate font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground sm:text-right">
          {stack}
        </span>
      </div>
    </m.li>
  );
}
