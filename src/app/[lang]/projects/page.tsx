import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ProjectsSection } from "@/components/sections/projects-section";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <ProjectsSection />;
}
