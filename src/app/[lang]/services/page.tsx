import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/content";
import { PageHeader } from "@/components/ui/page-header";
import { PageSection } from "@/components/layout/page-section";
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
const sectionClass = "space-y-4 border-t border-border pt-8";

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
    t("step1"),
    t("step2"),
    t("step3"),
    t("step4"),
    t("step5"),
    t("step6"),
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
  ];

  return (
    <PageSection>
      <PageHeader as="h1" title={t("h1")} description={t("lead")} />

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

      <section className={sectionClass}>
        <h2 className="section-heading">{t("s1Title")}</h2>
        <p className="section-copy">{t("s1p1")}</p>
        <p className="section-copy">{t("s1p2")}</p>
        <p className="section-copy">{t("s1p3")}</p>
        <p className="section-copy">{t("s1p4")}</p>
        <p className="section-copy">
          {t.rich("s1p5", {
            hubit: (chunks) => renderProjectLink(project.hubit, chunks),
          })}
        </p>
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
      </section>

      <section className={sectionClass}>
        <h2 className="section-heading">{t("s2Title")}</h2>
        <p className="section-copy">{t("s2p1")}</p>
        <p className="section-copy">{t("s2p2")}</p>
        <p className="section-copy">{t("s2p3")}</p>
        <p className="section-copy">
          {t.rich("s2p4", {
            wikonya: (chunks) => renderProjectLink(project.wikonya, chunks),
          })}
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className="section-heading">{t("s3Title")}</h2>
        <p className="section-copy">{t("s3p1")}</p>
        <p className="section-copy">
          {t.rich("s3p2", {
            cargopilot: (chunks) =>
              renderProjectLink(project.cargoPilot, chunks),
          })}
        </p>
        <p className="section-copy">{t("s3p3")}</p>
        <p>
          <Link
            href={{ pathname: "/blog/[slug]", params: { slug: post.coolify } }}
            className={evidenceLinkClass}
          >
            {t("s3LinkLabel")}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </p>
      </section>

      <section className={sectionClass}>
        <h2 className="section-heading">{t("s4Title")}</h2>
        <p className="section-copy">{t("s4p1")}</p>
        <p className="section-copy">
          {t.rich("s4p2", {
            bilet: (chunks) => renderProjectLink(project.ticket, chunks),
            ratelimit: (chunks) => renderPostLink(post.ccna, chunks),
          })}
        </p>
        <p className="section-copy">{t("s4p3")}</p>
      </section>

      <section className={sectionClass}>
        <h2 className="section-heading">{t("processTitle")}</h2>
        <p className="section-copy">{t("processIntro")}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/90">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="section-copy">{t("processOutro")}</p>
      </section>

      <section className={sectionClass}>
        <h2 className="section-heading">{t("faqTitle")}</h2>
        <dl className="divide-y divide-border">
          {faqs.map((item) => (
            <div key={item.q} className="py-5 first:pt-0">
              <dt className="text-base font-semibold leading-snug text-foreground">
                {item.q}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-foreground/90">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <ContactCta scope="services" />
    </PageSection>
  );
}
