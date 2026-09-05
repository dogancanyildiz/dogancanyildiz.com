import type { AppLocale } from "@/i18n/routing";

/**
 * Real identity data, sourced from .local/content/portfolio-content.md.
 * Used by structured data today and by the page copy from Faz 4 on.
 */
export const siteConfig = {
  person: {
    name: "Doğan Can YILDIZ",
    jobTitle: {
      en: "Full Stack Web Developer and DevOps Specialist",
      tr: "Full Stack Web Geliştirici ve DevOps Uzmanı",
    } satisfies Record<AppLocale, string>,
    location: {
      city: "Konya",
      country: "TR",
    },
    /** Public path stem; append .jpg/.webp when the file is delivered. */
    profileImagePath: "/images/profile",
    /**
     * Languages the person works in, ISO 639-1 codes, in the order the About
     * page's languages section names them (Turkish native, English working).
     * Feeds Person schema knowsLanguage; kept as codes rather than prose so
     * the structured value stays unambiguous while the visible paragraph
     * carries the same claim in words.
     */
    knowsLanguage: ["tr", "en"],
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
      "https://www.credly.com/users/dogancanyildiz",
      "https://x.com/dogancannyildiz",
      "https://www.instagram.com/dogancanyildiz.dev",
      "https://www.threads.com/@dogancanyildiz.dev",
    ],
  },
} as const;
