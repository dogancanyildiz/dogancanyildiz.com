import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { AboutContent } from "@/components/sections/about-content";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <AboutContent />;
}
