import type { AppLocale } from "@/i18n/routing";

/**
 * Real identity data, sourced from .local/content/portfolio-content.md.
 * Used by structured data today and by the page copy from Faz 4 on.
 */
export const siteConfig = {
  person: {
    name: "Doğan Can Yıldız",
    jobTitle: {
      en: "Full-Stack Web Developer and DevOps Engineer",
      tr: "Full-Stack Web Geliştirici ve DevOps Mühendisi",
    } satisfies Record<AppLocale, string>,
    location: {
      city: "Konya",
      country: "TR",
    },
    sameAs: [
      "https://github.com/dogancanyildiz",
      "https://www.linkedin.com/in/dogancanyildiz",
    ],
  },
} as const;
