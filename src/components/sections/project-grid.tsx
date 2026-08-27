import { ProjectCard } from "@/components/sections/project-card";
import type { ProjectCardData } from "@/lib/content";

interface ProjectGridProps {
  projects: ProjectCardData[];
}

// Server component: the domAnimation feature provider already sits once in
// the locale layout, so this file needs neither "use client" nor a second
// copy of that wrapper. Each ProjectCard is its own client boundary.
export function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {projects.map((project, index) => (
        <ProjectCard key={project.slug} project={project} index={index} />
      ))}
    </div>
  );
}
