"use client";

import { useState, useMemo } from "react";
import { useLocale } from "@/components/locale-provider";
import { ProjectCard } from "./project-card";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";

export function ProjectsSection() {
  const { t } = useLocale();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(
    () =>
      activeTag
        ? projects.filter((p) => p.tags.includes(activeTag))
        : projects,
    [activeTag]
  );

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("projects.title")}
        </h1>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          {t("projects.subtitle")}
        </p>

        <div className="mb-10 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              activeTag === null
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-transparent text-muted-foreground hover:border-foreground/50 hover:text-foreground"
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                activeTag === tag
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-transparent text-muted-foreground hover:border-foreground/50 hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
