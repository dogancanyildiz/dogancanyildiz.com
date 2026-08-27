import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/locale-url";
import { ContactPageContent } from "@/components/sections/contact-page-content";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: "metadata" });

  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: buildAlternates(lang, "/contact"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <ContactPageContent />;
}
