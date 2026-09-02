import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageSection } from "@/components/layout/page-section";
import {
  StatusScreen,
  statusLinksFor,
  type StatusVariant,
} from "@/components/status/status-screen";
import type { Locale } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

const VARIANT_TO_NAMESPACE = {
  construction: "status.construction",
  updating: "status.updating",
} as const;

const VARIANT_PATH = {
  construction: "/coming-soon",
  updating: "/updating",
} as const;

export async function statusPageMetadata(
  locale: Locale,
  variant: Exclude<StatusVariant, "notFound">
): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: VARIANT_TO_NAMESPACE[variant],
  });

  const metadata = await buildPageMetadata(
    locale,
    { kind: "static", path: VARIANT_PATH[variant] },
    {
      title: t("title"),
      description: t("description"),
    }
  );

  return {
    ...metadata,
    robots: { index: false, follow: false },
  };
}

export async function StatusRouteContent({
  locale,
  variant,
}: {
  locale: Locale;
  variant: Exclude<StatusVariant, "notFound">;
}) {
  const t = await getTranslations({
    locale,
    namespace: VARIANT_TO_NAMESPACE[variant],
  });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tNotFound = await getTranslations({ locale, namespace: "notFound" });
  const tBrand = await getTranslations({ locale, namespace: "brand" });

  return (
    <PageSection>
      <StatusScreen
        brandName={tBrand("name")}
        eyebrow={t("code")}
        title={t("title")}
        description={t("description")}
        links={statusLinksFor(locale, {
          home: tNotFound("backHome"),
          projects: tNav("projects"),
          blog: tNav("blog"),
          contact: tNav("contact"),
        })}
      />
    </PageSection>
  );
}
