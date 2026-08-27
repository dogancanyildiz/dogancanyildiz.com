"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ProjectCardData } from "@/lib/content";
import { fadeUp } from "@/lib/motion";

interface ProjectCardProps {
  project: ProjectCardData;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const t = useTranslations("projects");
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);

  return (
    <m.article
      variants={variants}
      initial="hidden"
      animate="show"
      custom={index}
      className="surface-panel relative flex h-full flex-col gap-4 p-6"
    >
      {project.cover ? (
        <Image
          src={project.cover.src}
          alt=""
          width={project.cover.width}
          height={project.cover.height}
          placeholder="blur"
          blurDataURL={project.cover.blurDataURL}
          sizes="(min-width: 1024px) 32rem, 100vw"
          className="h-40 w-full rounded-[1.25rem] object-cover"
        />
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl leading-tight">
          <Link href={project.href} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">
        {project.summary}
      </p>

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.14em]">
        <div>
          <dt className="text-muted-foreground">{t("role")}</dt>
          <dd className="text-foreground">{project.role}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("year")}</dt>
          <dd className="text-foreground">{project.year}</dd>
        </div>
      </dl>

      <ul className="flex flex-wrap gap-2">
        {project.stack.map((item) => (
          <li
            key={item}
            className="rounded-full border border-border px-3 py-1 font-mono text-xs tracking-[0.08em] text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </m.article>
  );
}
