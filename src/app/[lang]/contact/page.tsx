import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveLocale } from "@/lib/route-params";
import { ContactPageContent } from "@/components/sections/contact-page-content";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "contact" });

  return buildPageMetadata(locale, "/contact", {
    title: t("title"),
    description: t("description"),
    availableLocales: [...routing.locales],
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  return <ContactPageContent />;
}
