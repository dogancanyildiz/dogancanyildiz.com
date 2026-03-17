"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const { t } = useLocale();
  const title = t(`projects.items.${project.id}.title`);
  const description = t(`projects.items.${project.id}.description`);

  const content = (
    <Card className="h-full transition-colors hover:border-primary/30">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-lg">{title}</CardTitle>
          {project.year && (
            <span className="text-xs font-medium text-muted-foreground">
              {project.year}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <CardDescription>{description}</CardDescription>
        <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {tag}
          </span>
        ))}
        </div>
      </CardContent>
    </Card>
  );

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
    >
      <Link href={`/projects/${project.slug}`} className="block h-full">
        {content}
      </Link>
    </motion.div>
  );
}
