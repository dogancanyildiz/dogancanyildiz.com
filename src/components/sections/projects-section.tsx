"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "motion/react";
import { ProjectRow } from "./project-row";
import { projects } from "@/data/projects";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/section-heading";

export function ProjectsSection() {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(
    () =>
      activeTag ? projects.filter((p) => p.tags.includes(activeTag)) : projects,
    [activeTag]
  );

  return (
    <section className="section-space">
      <div className="page-shell space-y-10">
        <SectionHeading
          eyebrow={t("projects.eyebrow")}
          title={t("projects.title")}
          description={t("projects.subtitle")}
        />

        <div className="space-y-4">
          <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("projects.filtersTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              aria-pressed={activeTag === null}
              className={cn(
                "min-h-9 rounded-full border px-4 font-mono text-xs uppercase tracking-[0.14em] transition-colors",
                activeTag === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {t("projects.all")}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                aria-pressed={activeTag === tag}
                className={cn(
                  "min-h-9 rounded-full border px-4 font-mono text-xs uppercase tracking-[0.14em] transition-colors",
                  activeTag === tag
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <ul className="border-t border-border">
          {filtered.map((project, index) => (
            <ProjectRow
              key={project.id}
              project={project}
              index={index}
              variants={variants}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
