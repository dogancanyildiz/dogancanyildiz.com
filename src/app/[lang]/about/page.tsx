import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { SkillCategoryList } from "@/components/sections/skill-group-grid";
import { AboutSubnav } from "@/components/sections/about-subnav";
import { sortSkillGroups } from "@/lib/skills";
import { TestimonialsBand } from "@/components/sections/testimonials-band";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { ContentEntryBody, ContentEntryIndex } from "@/components/ui/content-entry";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ContactCta } from "@/components/sections/contact-cta";
import {
  certificates,
  community,
  education,
  experience,
  skills,
  speaking,
} from "@/content/profile";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/content";
import { hasCv } from "@/lib/cv";
import { profileImagePath } from "@/lib/profile-image";
import { CV_PATH } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo/page-metadata";

interface AboutPageProps {
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: "about" });

  return buildPageMetadata(lang, "/about", {
    title: t("title"),
    description: t("description"),
    availableLocales: [...routing.locales],
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  setRequestLocale(lang);

  const locale = lang as Locale;
  const t = await getTranslations({ locale, namespace: "about" });
  const talks = speaking[locale];
  const showCv = hasCv();
  const profileImageSrc = profileImagePath();

  return (
    <PageSection>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {profileImageSrc ? (
          <ProfileAvatar
            src={profileImageSrc}
            alt={t("title")}
            sizeClass="size-24 sm:size-28"
          />
        ) : null}
        <PageHeader as="h1" title={t("title")} description={t("lead")} />
      </div>

      <AboutSubnav locale={locale} />

      <div className="space-y-4">
        <p className="section-copy">{t("body1")}</p>
        <p className="section-copy">{t("body2")}</p>
        <p className="section-copy">{t("body3")}</p>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-4 border-y border-border py-5">
        <div>
          <p className="meta-label">{t("nowLabel")}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{t("now")}</p>
        </div>
        <div>
          <p className="meta-label">{t("locationLabel")}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {t("location")}
          </p>
        </div>
      </div>

      {showCv ? (
        <Button asChild size="sm">
          <a href={CV_PATH} download>
            <Download className="size-4" />
            {t("downloadCv")}
          </a>
        </Button>
      ) : null}

      <section id="about-skills" className="space-y-5 border-t border-border pt-8 scroll-mt-28">
        <h2 className="section-heading">{t("skillsTitle")}</h2>
        <SkillCategoryList groups={sortSkillGroups(skills[locale])} />
      </section>

      <section id="about-experience" className="space-y-5 border-t border-border pt-8 scroll-mt-28">
        <h2 className="section-heading">{t("experienceTitle")}</h2>
        <ul className="content-stack">
          {experience[locale].map((entry, index) => (
            <li
              key={`${entry.company}-${entry.period}`}
              className="content-entry space-y-3"
            >
              <ContentEntryIndex index={index} />
              <ContentEntryBody className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tag-pill">{entry.period}</span>
                  <span className="tag-pill">{entry.location}</span>
                </div>
                <h3 className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
                  {entry.role}
                </h3>
                <p className="meta-label">{entry.company}</p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/90">
                  {entry.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <ul className="flex flex-wrap gap-2 pt-1">
                  {entry.stack.map((item) => (
                    <li key={item}>
                      <span className="tag-pill normal-case tracking-normal">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </ContentEntryBody>
            </li>
          ))}
        </ul>
      </section>

      <section id="about-community" className="space-y-5 border-t border-border pt-8 scroll-mt-28">
        <h2 className="section-heading">{t("communityTitle")}</h2>
        <ul className="content-stack">
          {community[locale].map((entry, index) => (
            <li
              key={`${entry.organization}-${entry.period}`}
              className="content-entry space-y-2"
            >
              <ContentEntryIndex index={index} />
              <ContentEntryBody className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tag-pill">{entry.period}</span>
                </div>
                <h3 className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
                  {entry.organization}
                </h3>
                <p className="meta-label">{entry.role}</p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {entry.description}
                </p>
              </ContentEntryBody>
            </li>
          ))}
        </ul>
      </section>

      {talks.length > 0 ? (
        <section id="about-speaking" className="space-y-5 border-t border-border pt-8 scroll-mt-28">
          <h2 className="section-heading">{t("speakingTitle")}</h2>
          <ul className="divide-y divide-border">
            {talks.map((talk) => (
              <li
                key={`${talk.event}-${talk.date}`}
                className="py-4 text-sm text-foreground/90 first:pt-0"
              >
                {talk.event} · {talk.topic} · {talk.date}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="about-certificates" className="space-y-5 border-t border-border pt-8 scroll-mt-28">
        <h2 className="section-heading">{t("certificatesTitle")}</h2>
        <ul className="divide-y divide-border">
          {certificates[locale].map((certificate) => (
            <li key={certificate.name} className="space-y-1 py-4 first:pt-0">
              <p className="text-sm leading-relaxed">
                {certificate.name}
                {certificate.verifyUrl ? (
                  <>
                    {" "}
                    <a
                      href={certificate.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      {t("certificateVerify")}
                    </a>
                  </>
                ) : null}
              </p>
              <p className="meta-label">{certificate.issuer}</p>
              {certificate.detail ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {certificate.detail}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section id="about-education" className="space-y-5 border-t border-border pt-8 scroll-mt-28">
        <h2 className="section-heading">{t("educationTitle")}</h2>
        <ul className="divide-y divide-border">
          {education[locale].map((entry) => (
            <li
              key={`${entry.school}-${entry.period}`}
              className="space-y-1 py-4 first:pt-0"
            >
              <p className="text-sm leading-relaxed">{entry.program}</p>
              <p className="meta-label">
                {entry.school} · {entry.period}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="about-languages" className="space-y-3 border-t border-border pt-8 scroll-mt-28">
        <h2 className="section-heading">{t("languagesTitle")}</h2>
        <p className="section-copy">{t("languages")}</p>
      </section>

      <div id="about-testimonials" className="scroll-mt-28">
        <TestimonialsBand locale={locale} title={t("testimonialsTitle")} />
      </div>

      <ContactCta />
    </PageSection>
  );
}
