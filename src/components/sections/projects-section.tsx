"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ProjectCard } from "./project-card";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/section-heading";

export function ProjectsSection() {
  const t = useTranslations();
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

        <div className="surface-panel space-y-5 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {t("projects.filtersTitle")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag(null)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                activeTag === null
                  ? "border-primary/70 bg-primary text-primary-foreground"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:border-primary/35 hover:text-foreground"
              )}
            >
              {t("projects.all")}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  activeTag === tag
                    ? "border-primary/70 bg-primary text-primary-foreground"
                    : "border-border/70 bg-background/60 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              variant="standard"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
