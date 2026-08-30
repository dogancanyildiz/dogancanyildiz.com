import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  ContentEntryBody,
  ContentEntryIndex,
} from "@/components/ui/content-entry";
import { PageHeader } from "@/components/ui/page-header";
import { experience } from "@/content/profile";
import type { Locale } from "@/lib/content";

interface ExperienceSummaryProps {
  locale: Locale;
}

export async function ExperienceSummary({ locale }: ExperienceSummaryProps) {
  const t = await getTranslations({ locale, namespace: "home" });
  const entries = experience[locale];
  const latest = entries[0];
  if (!latest) return null;

  return (
    <section aria-labelledby="home-experience-heading" className="space-y-8">
      <PageHeader
        as="h2"
        titleId="home-experience-heading"
        title={t("experienceTitle")}
        description={t("experienceDescription")}
        action={
          <Link
            href={{ pathname: "/about", hash: "about-experience" }}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("experienceLink")}
          </Link>
        }
      />
      <ul className="content-stack">
        <li className="content-entry">
          <ContentEntryIndex index={0} />
          <ContentEntryBody className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag-pill">{latest.period}</span>
              <span className="tag-pill">{latest.location}</span>
            </div>
            <h3 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              {latest.role}
            </h3>
            <p className="meta-label">{latest.company}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {latest.bullets[0]}
            </p>
          </ContentEntryBody>
        </li>
      </ul>
    </section>
  );
}
