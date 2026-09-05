import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AppHref, Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/content";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbList } from "@/lib/seo/jsonld";

export interface BreadcrumbCrumb {
  /** Visible label and schema.org `name`. */
  name: string;
  /**
   * Ancestor pathname (a `pathnames` key such as `/blog`). Omitted on the
   * current page: it is not a link, and schema.org drops the trailing self
   * reference.
   */
  href?: AppHref;
}

/**
 * Breadcrumb trail for a page below the site root, rendered as a visible
 * `<nav>` and the matching BreadcrumbList JSON-LD from one source, so the
 * structured trail and the printed one can never drift. `items` is the trail
 * after Home, which this component prepends, so every page starts from the same
 * root. The home page itself has no breadcrumb.
 */
export async function Breadcrumb({
  locale,
  items,
}: {
  locale: Locale;
  items: BreadcrumbCrumb[];
}) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const trail: BreadcrumbCrumb[] = [{ name: t("home"), href: "/" }, ...items];

  const jsonLd = buildBreadcrumbList(
    locale,
    // Every ancestor href here is a plain pathname string; the AppHref union
    // also allows an object form, which the breadcrumb never uses. The current
    // page has no href and its path is dropped by buildBreadcrumbList anyway.
    trail.map((crumb) => ({
      name: crumb.name,
      path: typeof crumb.href === "string" ? crumb.href : "/",
    }))
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <nav aria-label={t("breadcrumb")}>
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {trail.map((crumb, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={crumb.name} className="flex items-center gap-1.5">
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {crumb.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground">
                    {crumb.name}
                  </span>
                )}
                {!isLast ? (
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
