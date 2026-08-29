import type { AppLocale } from "@/i18n/routing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildWebSite } from "@/lib/seo/jsonld";

/**
 * WebSite structured data.
 *
 * Rendered by the home page of each locale, not by the shared layout: a
 * WebSite node belongs to the site root, and putting it in the layout would
 * repeat it on every article and project page for no gain. `inLanguage`
 * differs per locale while the `@id` does not, which is how one site with two
 * language versions is described.
 */
export function WebSiteJsonLd({
  locale,
  name,
  description,
}: {
  locale: AppLocale;
  name: string;
  description: string;
}) {
  return <JsonLd data={buildWebSite(locale, name, description)} />;
}
