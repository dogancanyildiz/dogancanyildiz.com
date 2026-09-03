import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/content";
import { PageHeader } from "@/components/ui/page-header";
import {
  ContentEntryBody,
  ContentEntryIndex,
} from "@/components/ui/content-entry";
import { SkillTag } from "@/components/ui/skill-tag";
import { PageSection } from "@/components/layout/page-section";
import { ServicesSubnav } from "@/components/sections/services-subnav";
import { ContactCta } from "@/components/sections/contact-cta";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveLocale } from "@/lib/route-params";
import { routing } from "@/i18n/routing";

interface ServicesPageProps {
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: ServicesPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "services" });

  // absoluteTitle because the title already carries the site name after the
  // pipe; the layout's "%s | name" template would otherwise double it.
  return buildPageMetadata(
    locale,
    { kind: "static", path: "/services" },
    {
      title: t("title"),
      description: t("description"),
      absoluteTitle: true,
    }
  );
}

/**
 * Content detail and blog slugs differ per locale (the Turkish renames of the
 * ticket and CCNA entries), so the inline evidence links resolve their slug
 * from the active locale rather than hard coding one shape.
 */
function projectSlugs(locale: Locale) {
  return {
    koklu: "koklu-hukuk",
    hubit: "hubit",
    wikonya: "wikonya",
    cargoPilot: "cargo-pilot",
    ticket:
      locale === "tr" ? "bilet-satin-alma-sistemi" : "ticket-purchasing-system",
  };
}

function postSlugs(locale: Locale) {
  return {
    coolify:
      locale === "tr"
        ? "coolify-ile-kendi-sunucumda"
        : "self-hosting-with-coolify",
    ccna:
      locale === "tr"
        ? "ccna-dan-web-guvenligine"
        : "from-ccna-to-web-security",
  };
}

const inlineLinkClass = "text-primary underline underline-offset-4";
const evidenceLinkClass =
  "inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline";
const sectionClass = "space-y-5 border-t border-border pt-8 scroll-mt-32";
// Same left-rule treatment as .outcome-accent (the "SONUÇ" line on a project
// card) but on the neutral border color: a proof line earns the primary
// accent, a limit is a boundary, not a highlight.
const limitLineClass =
  "border-l-2 border-border pl-3 text-sm font-medium leading-snug text-foreground/90";

// Rich-text chunk renderers for the inline case and post links. Lower-cased
// and returning through a Link so the t.rich tag callbacks stay call
// expressions rather than inline component definitions.
function renderProjectLink(slug: string, chunks: ReactNode) {
  return (
    <Link
      href={{ pathname: "/projects/[slug]", params: { slug } }}
      className={inlineLinkClass}
    >
      {chunks}
    </Link>
  );
}

function renderPostLink(slug: string, chunks: ReactNode) {
  return (
    <Link
      href={{ pathname: "/blog/[slug]", params: { slug } }}
      className={inlineLinkClass}
    >
      {chunks}
    </Link>
  );
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "services" });
  const project = projectSlugs(locale);
  const post = postSlugs(locale);

  const steps = [
    { title: t("step1Title"), body: t("step1Body") },
    { title: t("step2Title"), body: t("step2Body") },
    { title: t("step3Title"), body: t("step3Body") },
    { title: t("step4Title"), body: t("step4Body") },
    { title: t("step5Title"), body: t("step5Body") },
    { title: t("step6Title"), body: t("step6Body") },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
  ];
  const faqsLeft = faqs.slice(0, 3);
  const faqsRight = faqs.slice(3);

  return (
    <PageSection>
      <PageHeader
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("h1")}
        description={`${t("headline")} ${t("lead")}`}
      />

      <div className="flex flex-wrap gap-x-8 gap-y-4 border-y border-border py-5">
        <div>
          <p className="meta-label">{t("locationLabel")}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {t("locationValue")}
          </p>
        </div>
        <div>
          <p className="meta-label">{t("workLabel")}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {t("workValue")}
          </p>
        </div>
        <div>
          <p className="meta-label">{t("contactLabel")}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {t("contactValue")}
          </p>
        </div>
      </div>

      <ServicesSubnav locale={locale} />

      <ul className="content-stack">
        <li id="services-corporate" className="content-entry scroll-mt-32">
          <ContentEntryIndex index={0} />
          <ContentEntryBody>
            <span className="tag-pill">{t("s1Pill")}</span>
            <h3 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              {t("s1Title")}
            </h3>
            <p className="outcome-accent">
              <span className="meta-label">{t("kanitLabel")}</span>{" "}
              {t.rich("s1Kanit", {
                koklu: (chunks) => renderProjectLink(project.koklu, chunks),
              })}
            </p>
            <p className="section-copy">{t("s1p1")}</p>
            <p className="section-copy">{t("s1p2")}</p>
            <p className="section-copy">{t("s1p3")}</p>
            <p className="section-copy">
              {t.rich("s1p5", {
                hubit: (chunks) => renderProjectLink(project.hubit, chunks),
              })}
            </p>
            <p className={limitLineClass}>
              <span className="meta-label">{t("limitLabel")}</span>{" "}
              {t("s1Limit")}
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              <li>
                <SkillTag label="Next.js" />
              </li>
            </ul>
            <p>
              <Link
                href={{
                  pathname: "/projects/[slug]",
                  params: { slug: project.koklu },
                }}
                className={evidenceLinkClass}
              >
                {t("s1LinkLabel")}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </p>
          </ContentEntryBody>
        </li>

        <li id="services-app" className="content-entry scroll-mt-32">
          <ContentEntryIndex index={1} />
          <ContentEntryBody>
            <span className="tag-pill">{t("s2Pill")}</span>
            <h3 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              {t("s2Title")}
            </h3>
            <p className="outcome-accent">
              <span className="meta-label">{t("kanitLabel")}</span>{" "}
              {t.rich("s2Kanit", {
                wikonya: (chunks) => renderProjectLink(project.wikonya, chunks),
              })}
            </p>
            <p className="section-copy">{t("s2p1")}</p>
            <p className="section-copy">{t("s2p2")}</p>
            <p className="section-copy">{t("s2p3")}</p>
            <p className={limitLineClass}>
              <span className="meta-label">{t("limitLabel")}</span>{" "}
              {t("s2Limit")}
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {[
                "Next.js",
                "React",
                "Node.js",
                "Express",
                "PHP",
                "MySQL",
                "MongoDB",
                "SQLite",
              ].map((tag) => (
                <li key={tag}>
                  <SkillTag label={tag} />
                </li>
              ))}
            </ul>
          </ContentEntryBody>
        </li>

        <li id="services-deployment" className="content-entry scroll-mt-32">
          <ContentEntryIndex index={2} />
          <ContentEntryBody>
            <span className="tag-pill">{t("s3Pill")}</span>
            <h3 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              {t("s3Title")}
            </h3>
            <p className="outcome-accent">
              <span className="meta-label">{t("kanitLabel")}</span>{" "}
              {t.rich("s3Kanit", {
                cargopilot: (chunks) =>
                  renderProjectLink(project.cargoPilot, chunks),
              })}
            </p>
            <p className="section-copy">{t("s3p1")}</p>
            <p className={limitLineClass}>
              <span className="meta-label">{t("limitLabel")}</span>{" "}
              {t("s3Limit")}
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {["Docker", "GitHub Actions", "Coolify", "Traefik"].map((tag) => (
                <li key={tag}>
                  <SkillTag label={tag} />
                </li>
              ))}
            </ul>
            <p>
              <Link
                href={{
                  pathname: "/blog/[slug]",
                  params: { slug: post.coolify },
                }}
                className={evidenceLinkClass}
              >
                {t("s3LinkLabel")}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </p>
          </ContentEntryBody>
        </li>

        <li id="services-security" className="content-entry scroll-mt-32">
          <ContentEntryIndex index={3} />
          <ContentEntryBody>
            <span className="tag-pill">{t("s4Pill")}</span>
            <h3 className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              {t("s4Title")}
            </h3>
            <p className="section-copy">{t("s4p1")}</p>
            <p className="section-copy">
              {t.rich("s4p2", {
                bilet: (chunks) => renderProjectLink(project.ticket, chunks),
                ratelimit: (chunks) => renderPostLink(post.ccna, chunks),
              })}
            </p>
            <p className={limitLineClass}>
              <span className="meta-label">{t("limitLabel")}</span>{" "}
              {t("s4Limit")}
            </p>
          </ContentEntryBody>
        </li>
      </ul>

      <section id="services-process" className={sectionClass}>
        <h2 className="section-heading">{t("processTitle")}</h2>
        <p className="section-copy">{t("processIntro")}</p>
        <ul className="content-stack">
          {steps.map((step, index) => (
            <li key={step.title} className="content-entry">
              <ContentEntryIndex index={index} />
              <ContentEntryBody className="space-y-1.5">
                <h3 className="text-base font-semibold leading-snug tracking-tight sm:text-lg">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {step.body}
                </p>
              </ContentEntryBody>
            </li>
          ))}
        </ul>
        <div>
          <p className="meta-label">{t("responseTimeLabel")}</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            {t("processOutro")}
          </p>
        </div>
      </section>

      <section id="services-faq" className={sectionClass}>
        <p className="eyebrow">{t("faqEyebrow")}</p>
        <h2 className="section-heading">{t("faqTitle")}</h2>
        <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
          <dl className="divide-y divide-border">
            {faqsLeft.map((item) => (
              <div key={item.q} className="py-5 first:pt-0">
                <dt className="text-base font-medium leading-snug text-foreground">
                  {item.q}
                </dt>
                <dd className="mt-2 section-copy">{item.a}</dd>
              </div>
            ))}
          </dl>
          <dl className="divide-y divide-border border-t border-border pt-5 lg:border-t-0 lg:pt-0">
            {faqsRight.map((item) => (
              <div key={item.q} className="py-5 first:pt-0">
                <dt className="text-base font-medium leading-snug text-foreground">
                  {item.q}
                </dt>
                <dd className="mt-2 section-copy">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ContactCta scope="services" />
    </PageSection>
  );
}
