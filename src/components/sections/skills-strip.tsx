import { getTranslations } from "next-intl/server";
import type { SkillGroup } from "@/content/profile";
import { SkillCategoryList } from "@/components/sections/skill-group-grid";
import { PageHeader } from "@/components/ui/page-header";

interface SkillsStripProps {
  groups: SkillGroup[];
}

/**
 * Server rendered on purpose. The entrance animation this section used to run
 * printed `opacity: 0` into the prerendered HTML, and being a client component
 * dragged the whole simple-icons path table behind SkillTag into the browser
 * bundle. Neither buys anything here: the strip is static content.
 */
export async function SkillsStrip({ groups }: SkillsStripProps) {
  const t = await getTranslations("home");

  return (
    <div className="space-y-8">
      <PageHeader
        as="h2"
        eyebrow={t("skillsEyebrow")}
        title={t("skillsTitle")}
        description={t("skillsSubtitle")}
      />
      <SkillCategoryList groups={groups} />
    </div>
  );
}
