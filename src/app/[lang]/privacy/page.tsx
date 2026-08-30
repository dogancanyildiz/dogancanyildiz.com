import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveLocale } from "@/lib/route-params";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/layout/page-section";

interface PrivacyPageProps {
  params: Promise<{ lang: string }>;
}

const SECTIONS = [
  ["whoTitle", "whoBody"],
  ["storageTitle", "storageBody"],
  ["analyticsTitle", "analyticsBody"],
  ["formTitle", "formBody"],
  ["contactTitle", "contactBody"],
] as const;

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "privacy" });

  return buildPageMetadata(locale, "/privacy", {
    title: t("title"),
    description: t("description"),
    availableLocales: [...routing.locales],
  });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <PageSection>
      <PageHeader as="h1" title={t("title")} description={t("lead")} />
      <div className="max-w-2xl space-y-8">
        {SECTIONS.map(([headingKey, bodyKey]) => (
          <section key={headingKey} className="space-y-2">
            <h2 className="section-heading">{t(headingKey)}</h2>
            <p className="section-copy">{t(bodyKey)}</p>
          </section>
        ))}
      </div>
    </PageSection>
  );
}
