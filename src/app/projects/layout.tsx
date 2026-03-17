import type { Metadata } from "next";
import { cookies } from "next/headers";
import { translations } from "@/lib/i18n/translations";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "tr" ? "tr" : "en";
  const m = translations[locale].metadata;
  return { title: m.projectsTitle, description: m.projectsDescription };
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
