import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import { profileImagePath } from "@/lib/profile-image";
import { identityUrl, personId } from "@/lib/seo/jsonld";
import { siteConfig } from "@/lib/site-config";

/**
 * Person structured data for the home page.
 *
 * The `@id` is the same on both locale home pages and in every article's
 * author and publisher slot, so all of them describe one entity instead of
 * three. `url` follows it and stays on the default locale root (Turkish since
 * the 2026-08-30 switch; it was the English root before): a per locale url
 * would give the same `@id` two different homes, which is exactly the split
 * the shared id is there to close. Only `jobTitle` is translated, because it
 * is a label rather than an identifier.
 *
 * The payload is fully static, but "<" is escaped anyway so the JSON can never
 * terminate the surrounding script tag.
 */
export function PersonJsonLd({ locale }: { locale: AppLocale }) {
  const imageSrc = profileImagePath();
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId(),
    name: siteConfig.person.name,
    jobTitle: siteConfig.person.jobTitle[locale],
    url: identityUrl(),
    ...(imageSrc ? { image: `${siteUrl()}${imageSrc}` } : {}),
    knowsAbout: [...siteConfig.person.knowsAbout],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: siteConfig.person.alumniOf.name,
    },
    worksFor: {
      "@type": "Organization",
      name: siteConfig.person.worksFor.name,
    },
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
