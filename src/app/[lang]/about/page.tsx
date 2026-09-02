import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { SkillCategoryList } from "@/components/sections/skill-group-grid";
import { AboutSubnav } from "@/components/sections/about-subnav";
import { CertificateList } from "@/components/sections/certificate-list";
import { TestimonialsBand } from "@/components/sections/testimonials-band";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  ContentEntryBody,
  ContentEntryIndex,
} from "@/components/ui/content-entry";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ContactCta } from "@/components/sections/contact-cta";
import {
  community,
  education,
  experience,
  skills,
  speaking,
} from "@/content/profile";
import { routing } from "@/i18n/routing";
import { hasCv } from "@/lib/cv";
import { profileImagePath } from "@/lib/profile-image";
import { CV_PATH } from "@/lib/site";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveLocale } from "@/lib/route-params";

interface AboutPageProps {
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "about" });

  return buildPageMetadata(
    locale,
    { kind: "static", path: "/about" },
    {
      title: t("title"),
      description: t("description"),
    }
  );
}

export default async function AboutPage({ params }: AboutPageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "about" });
  const talks = speaking[locale];
  const roles = experience[locale];
  const communityRoles = community[locale];
  const schools = education[locale];
  const showCv = hasCv();
  const profileImageSrc = profileImagePath();

  return (
    <PageSection>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {profileImageSrc ? (
          <ProfileAvatar
            src={profileImageSrc}
            // Describes the person in the photo, not the page. "About" told a
            // screen reader nothing the heading beside it had not said.
            alt={t("profileImageAlt")}
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
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {t("now")}
          </p>
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

      <section
        id="about-skills"
        className="space-y-5 border-t border-border pt-8 scroll-mt-32"
      >
        <h2 className="section-heading">{t("skillsTitle")}</h2>
        {/* SkillCategoryList sorts by group order itself; sorting here too
            just did the same work twice. */}
        <SkillCategoryList groups={skills[locale]} />
      </section>

      <section
        id="about-experience"
        className="space-y-5 border-t border-border pt-8 scroll-mt-32"
      >
        <h2 className="section-heading">{t("experienceTitle")}</h2>
        {roles.length > 0 ? (
          <ul className="content-stack">
            {roles.map((entry, index) => (
              <li
                key={`${entry.company}-${entry.period}`}
                className="content-entry"
              >
                <ContentEntryIndex index={index} />
                {/* ContentEntryBody already applies space-y-3. */}
                <ContentEntryBody>
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
        ) : (
          <p className="section-copy">{t("emptyList")}</p>
        )}
      </section>

      <section
        id="about-community"
        className="space-y-5 border-t border-border pt-8 scroll-mt-32"
      >
        <h2 className="section-heading">{t("communityTitle")}</h2>
        {communityRoles.length > 0 ? (
          <ul className="content-stack">
            {communityRoles.map((entry, index) => (
              <li
                key={`${entry.organization}-${entry.period}`}
                className="content-entry"
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
        ) : (
          <p className="section-copy">{t("emptyList")}</p>
        )}
      </section>

      {talks.length > 0 ? (
        <section
          id="about-speaking"
          className="space-y-5 border-t border-border pt-8 scroll-mt-32"
        >
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

      <section
        id="about-certificates"
        className="space-y-5 border-t border-border pt-8 scroll-mt-32"
      >
        <h2 className="section-heading">{t("certificatesTitle")}</h2>
        <CertificateList locale={locale} />
      </section>

      <section
        id="about-education"
        className="space-y-5 border-t border-border pt-8 scroll-mt-32"
      >
        <h2 className="section-heading">{t("educationTitle")}</h2>
        {schools.length > 0 ? (
          <ul className="divide-y divide-border">
            {schools.map((entry) => (
              <li
                key={`${entry.school}-${entry.period}`}
                className="flex items-start gap-4 py-4 first:pt-0"
              >
                {/* The slot keeps its width whether or not the school has a
                    mark, so the programme names stay aligned down the list.
                    24 wide rather than square: two of the four marks are
                    wordmarks, and 40px of height on those is 170px of width. */}
                <div className="flex h-10 w-24 shrink-0 items-center justify-center">
                  {entry.logo ? (
                    <Image
                      src={entry.logo.src}
                      // Decorative: the school is written out in the line
                      // beside it, and an alt here would say it twice.
                      alt=""
                      width={entry.logo.width}
                      height={entry.logo.height}
                      sizes="40px"
                      className="h-10 w-auto max-w-full object-contain"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm leading-relaxed">{entry.program}</p>
                  <p className="meta-label">
                    {entry.school} · {entry.period}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="section-copy">{t("emptyList")}</p>
        )}
      </section>

      <section
        id="about-languages"
        className="space-y-3 border-t border-border pt-8 scroll-mt-32"
      >
        <h2 className="section-heading">{t("languagesTitle")}</h2>
        <p className="section-copy">{t("languages")}</p>
      </section>

      <div id="about-testimonials" className="scroll-mt-32">
        <TestimonialsBand locale={locale} title={t("testimonialsTitle")} />
      </div>

      <ContactCta />
    </PageSection>
  );
}
