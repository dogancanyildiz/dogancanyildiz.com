import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * Boundary for notFound() thrown inside a locale, for example by
 * projects/[slug]/page.tsx. It lives under [lang] because the locale layout is
 * the root layout of this app: a not-found file placed higher up would render
 * without globals.css, without the header and footer and without an html lang
 * attribute.
 *
 * Paths that do not resolve to a route at all never reach this file, they are
 * answered by src/app/global-not-found.tsx instead.
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
