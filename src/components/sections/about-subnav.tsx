import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/content";
import { speaking } from "@/content/profile";
import { testimonials } from "@/content/testimonials";

interface AboutSubnavProps {
  locale: Locale;
}

const SECTIONS = [
  { id: "about-skills", messageKey: "skillsTitle" as const },
  { id: "about-experience", messageKey: "experienceTitle" as const },
  { id: "about-community", messageKey: "communityTitle" as const },
  { id: "about-speaking", messageKey: "speakingTitle" as const, optional: true },
  { id: "about-certificates", messageKey: "certificatesTitle" as const },
  { id: "about-education", messageKey: "educationTitle" as const },
  { id: "about-languages", messageKey: "languagesTitle" as const },
  { id: "about-testimonials", messageKey: "testimonialsTitle" as const, optional: true },
] as const;

export async function AboutSubnav({ locale }: AboutSubnavProps) {
  const t = await getTranslations({ locale, namespace: "about" });
  const showTalks = speaking[locale].length > 0;
  const showTestimonials = testimonials[locale].length > 0;

  const items = SECTIONS.filter((section) => {
    if (section.id === "about-speaking") return showTalks;
    if (section.id === "about-testimonials") return showTestimonials;
    return true;
  });

  return (
    <nav
      aria-label={t("subnavLabel")}
      className="sticky top-14 z-30 -mx-4 overflow-x-auto border-b border-border bg-background/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6"
    >
      <ul className="flex min-w-max gap-1">
        {items.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="tap-target inline-flex items-center rounded-full px-3 py-1.5 text-sm text-muted-foreground no-underline transition-colors hover:bg-accent/40 hover:text-foreground"
            >
              {t(section.messageKey)}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
