import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { projects } from "@/data/projects";
import { ProjectDetail } from "@/components/sections/project-detail";

export function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    projects.map((project) => ({ lang, slug: project.slug }))
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  setRequestLocale(lang);

  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();

  return <ProjectDetail project={project} />;
}
