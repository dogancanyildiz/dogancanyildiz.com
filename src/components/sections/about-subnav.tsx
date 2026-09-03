import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/content";
import { speaking } from "@/content/profile";
import { testimonials } from "@/content/testimonials";
import { PageSubnavList } from "@/components/ui/page-subnav-list";

interface AboutSubnavProps {
  locale: Locale;
}

type AboutMessageKey =
  | "skillsTitle"
  | "experienceTitle"
  | "communityTitle"
  | "speakingTitle"
  | "certificatesTitle"
  | "educationTitle"
  | "languagesTitle"
  | "testimonialsTitle";

interface AboutSubnavSection {
  id: string;
  messageKey: AboutMessageKey;
  isVisible?: () => boolean;
}

export async function AboutSubnav({ locale }: AboutSubnavProps) {
  const t = await getTranslations({ locale, namespace: "about" });
  const showTalks = speaking[locale].length > 0;
  const showTestimonials = testimonials[locale].length > 0;

  const sections: AboutSubnavSection[] = [
    { id: "about-skills", messageKey: "skillsTitle" },
    { id: "about-experience", messageKey: "experienceTitle" },
    { id: "about-community", messageKey: "communityTitle" },
    {
      id: "about-speaking",
      messageKey: "speakingTitle",
      isVisible: () => showTalks,
    },
    { id: "about-certificates", messageKey: "certificatesTitle" },
    { id: "about-education", messageKey: "educationTitle" },
    { id: "about-languages", messageKey: "languagesTitle" },
    {
      id: "about-testimonials",
      messageKey: "testimonialsTitle",
      isVisible: () => showTestimonials,
    },
  ];

  const items = sections
    .filter((section) => section.isVisible?.() ?? true)
    .map((section) => ({ id: section.id, label: t(section.messageKey) }));

  return <PageSubnavList items={items} ariaLabel={t("subnavLabel")} />;
}
