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
    /** Public path stem; append .jpg/.webp when the file is delivered. */
    profileImagePath: "/images/profile",
    /** Featured skills for Person schema knowsAbout. */
    knowsAbout: [
      "TypeScript",
      "Next.js",
      "React",
      "Node.js",
      "Docker",
      "DevOps",
      "CI/CD",
      "Linux",
      "Network security",
    ],
    alumniOf: {
      name: "Necmettin Erbakan University",
    },
    worksFor: {
      name: "BerrSoft Bilgi Teknolojileri",
    },
    sameAs: [
      "https://github.com/dogancanyildiz",
      "https://www.linkedin.com/in/dogancanyildiz",
    ],
  },
} as const;
