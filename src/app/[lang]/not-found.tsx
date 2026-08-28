import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

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
  const t = useTranslations("notFound");

  return (
    <section className="section-space">
      <div className="page-shell flex flex-col items-start gap-6">
        <span className="eyebrow">{t("code")}</span>
        <h1 className="max-w-3xl page-title">{t("title")}</h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          {t("description")}
        </p>
        <Button asChild size="lg">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </section>
  );
}
