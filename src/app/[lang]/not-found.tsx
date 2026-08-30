import { useLocale, useTranslations } from "next-intl";
import { PageSection } from "@/components/layout/page-section";
import {
  StatusScreen,
  statusLinksFor,
} from "@/components/status/status-screen";
import type { Locale } from "@/lib/content";

/**
 * Inert while experimental.globalNotFound is on.
 *
 * That flag (next.config.ts) routes every 404 to src/app/global-not-found.tsx,
 * including a notFound() thrown inside a locale by projects/[slug]/page.tsx or
 * blog/[slug]/page.tsx. Verified against a production build: /tr/blog/<unknown>
 * answers 404 with the global document, which carries neither the header nor
 * the footer nor the .page-title h1 below. Nothing rendered here reaches a
 * visitor today.
 *
 * It is kept because it is the non-experimental path: turn the flag off and
 * this file is the boundary again. It lives under [lang] because the locale
 * layout is the root layout of this app, so a not-found file placed higher up
 * would render without globals.css, without the header and footer and without
 * an html lang attribute.
 *
 * next-intl reads the active locale from the request, so this file cannot take
 * params and has to stay a synchronous component.
 */
export default function LocaleNotFound() {
  const locale = useLocale() as Locale;
  const t = useTranslations("notFound");
  const tNav = useTranslations("nav");
  const tBrand = useTranslations("brand");

  return (
    <PageSection>
      <StatusScreen
        brandName={tBrand("name")}
        eyebrow={t("code")}
        title={t("title")}
        description={t("description")}
        links={statusLinksFor(locale, {
          home: t("backHome"),
          projects: tNav("projects"),
          blog: tNav("blog"),
          contact: tNav("contact"),
        })}
      />
    </PageSection>
  );
}
