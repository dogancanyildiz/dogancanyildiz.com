import type { AppLocale } from "@/i18n/routing";
import { localeUrl } from "@/lib/seo/locale-url";
import { siteConfig } from "@/lib/site-config";

/**
 * Person structured data for the home page.
 * The payload is fully static, but "<" is escaped anyway so the JSON can never
 * terminate the surrounding script tag.
 */
export function PersonJsonLd({ locale }: { locale: AppLocale }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.person.name,
    jobTitle: siteConfig.person.jobTitle[locale],
    url: localeUrl(locale, "/"),
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.person.location.city,
      addressCountry: siteConfig.person.location.country,
    },
    sameAs: [...siteConfig.person.sameAs],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
