"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight, ExternalLink, Github } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ContentEntryBody, ContentEntryIndex } from "@/components/ui/content-entry";
import { SkillTag } from "@/components/ui/skill-tag";
import type { ProjectCardData } from "@/lib/content";
import { fadeUp, MOTION_ITEM_CLASS } from "@/lib/motion";

interface ProjectListProps {
  projects: ProjectCardData[];
  /** h2 when the list sits directly under the page h1, h3 under a section h2. */
  headingLevel?: "h2" | "h3";
}

export function ProjectList({
  projects,
  headingLevel = "h2",
}: ProjectListProps) {
  const Heading = headingLevel;
  const t = useTranslations("projects");
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);

  return (
    <ul className="content-stack">
      {projects.map((project, index) => (
        <m.li
          key={project.slug}
          variants={variants}
          initial="hidden"
          animate="show"
          custom={index}
          className={`content-entry group list-row ${MOTION_ITEM_CLASS} ${
            project.cover ? "lg:grid-cols-[3.5rem_minmax(0,1fr)_7rem]" : ""
          }`}
        >
          <ContentEntryIndex index={index} />

          <ContentEntryBody>
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag-pill">{project.year}</span>
              <span className="tag-pill max-w-full truncate">{project.role}</span>
            </div>

            <div className="flex items-start gap-3">
              <Heading className="min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                <Link
                  href={project.href}
                  className="after:absolute after:inset-0 text-foreground no-underline transition-colors group-hover:text-primary"
                >
                  {project.title}
                </Link>
              </Heading>
              <ArrowUpRight
                className="entry-arrow mt-1"
                aria-hidden="true"
              />
            </div>

            <p className="outcome-accent">
              <span className="meta-label">{t("outcome")}</span>{" "}
              {project.outcome}
            </p>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {project.summary}
            </p>

            <ul className="flex flex-wrap gap-2 pt-1">
              {project.stack.slice(0, 5).map((item) => (
                <li key={item}>
                  <SkillTag label={item} />
                </li>
              ))}
              {project.stack.length > 5 ? (
                <li>
                  <span className="tag-pill">+{project.stack.length - 5}</span>
                </li>
              ) : null}
            </ul>

            {project.liveUrl || project.repoUrl ? (
              <div className="relative z-10 flex flex-wrap gap-2 pt-1">
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tag-pill inline-flex items-center gap-1.5 normal-case tracking-normal transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <ExternalLink className="size-3" aria-hidden="true" />
                    {t("viewLive")}
                  </a>
                ) : null}
                {project.repoUrl ? (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tag-pill inline-flex items-center gap-1.5 normal-case tracking-normal transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Github className="size-3" aria-hidden="true" />
                    {t("viewSource")}
                  </a>
                ) : null}
              </div>
            ) : null}
          </ContentEntryBody>

          {project.cover ? (
            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-lg border border-border/70 lg:block">
              <Image
                src={project.cover.src}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
                placeholder={project.cover.blurDataURL ? "blur" : undefined}
                blurDataURL={project.cover.blurDataURL}
              />
            </div>
          ) : null}
        </m.li>
      ))}
    </ul>
  );
}
