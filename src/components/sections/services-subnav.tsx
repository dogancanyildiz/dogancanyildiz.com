import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/content";
import { PageSubnavList } from "@/components/ui/page-subnav-list";

interface ServicesSubnavProps {
  locale: Locale;
}

export async function ServicesSubnav({ locale }: ServicesSubnavProps) {
  const t = await getTranslations({ locale, namespace: "services" });

  const items = [
    { id: "services-corporate", label: t("navCorporate") },
    { id: "services-app", label: t("navApp") },
    { id: "services-deployment", label: t("navDeployment") },
    { id: "services-security", label: t("navSecurity") },
    { id: "services-process", label: t("navProcess") },
    // Reuses the section's own heading, the same way About's certificate and
    // education nav pills reuse their section titles.
    { id: "services-faq", label: t("faqTitle") },
  ];

  return <PageSubnavList items={items} ariaLabel={t("subnavLabel")} />;
}
