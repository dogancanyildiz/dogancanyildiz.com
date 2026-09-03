import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import { profileImagePath } from "@/lib/profile-image";
import { buildCredentials, identityUrl, personId } from "@/lib/seo/jsonld";
import { CONTACT_EMAIL_PUBLIC } from "@/lib/site";
import { siteConfig } from "@/lib/site-config";

/**
 * Person structured data, rendered on the home page and on /hakkimda.
 *
 * The `@id` is the same on both locale home pages, on the About page, and in
 * every article's author and publisher slot, so all of them describe one
 * entity instead of several. Rendering the same node on two pages is fine:
 * schema.org merges by `@id`, so the union of the properties is what a
 * consumer sees. `url` follows the id and stays on the default locale root
 * (Turkish since the 2026-08-30 switch; it was the English root before): a per
 * locale url would give the same `@id` two different homes, which is exactly
 * the split the shared id is there to close. Only `jobTitle` and the occupation
 * name are translated, because they are labels rather than identifiers.
 *
 * `description` is passed only where its text is visible on the page (the About
 * lead), never on the home page: structured text with no visible counterpart
 * is hidden content. `knowsLanguage`, `hasOccupation` and `email` all have a
 * visible home too, the languages section, the role line, and the footer
 * mailto respectively, so they ride on every render.
 *
 * The payload is fully static, but "<" is escaped anyway so the JSON can never
 * terminate the surrounding script tag.
 */
export function PersonJsonLd({
  locale,
  description,
}: {
  locale: AppLocale;
  description?: string;
}) {
  const imageSrc = profileImagePath();
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId(),
    name: siteConfig.person.name,
    jobTitle: siteConfig.person.jobTitle[locale],
    ...(description ? { description } : {}),
    url: identityUrl(),
    ...(imageSrc ? { image: `${siteUrl()}${imageSrc}` } : {}),
    knowsAbout: [...siteConfig.person.knowsAbout],
    knowsLanguage: [...siteConfig.person.knowsLanguage],
    // name mirrors the visible role line; occupationLocation carries the same
    // Konya/TR pair as the PostalAddress below, so the local signal and the
    // address never disagree about where the work happens.
    hasOccupation: {
      "@type": "Occupation",
      name: siteConfig.person.jobTitle[locale],
      occupationLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: siteConfig.person.location.city,
          addressCountry: siteConfig.person.location.country,
        },
      },
    },
    // The same address the footer prints as a visible mailto, so the graph's
    // contact point and the page's own contact link are one value.
    email: CONTACT_EMAIL_PUBLIC,
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
    // Every certificate the About page lists, each pointing at the issuer's
    // own verification page. A claim a reader can check is worth more in the
    // graph than one more adjective in knowsAbout.
    hasCredential: buildCredentials(locale),
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
