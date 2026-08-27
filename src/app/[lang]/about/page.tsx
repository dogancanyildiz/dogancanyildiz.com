import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="section-space">
      <div className="page-shell-reading space-y-16">
        <header className="space-y-6">
          <h1 className="text-4xl leading-tight sm:text-5xl">{t("title")}</h1>
          <p className="section-copy">{t("lead")}</p>
          <p className="section-copy">{t("body1")}</p>
          <p className="section-copy">{t("body2")}</p>
          <p className="section-copy">{t("body3")}</p>

          <dl className="grid gap-4 border-y border-border py-6 font-mono text-sm sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("nowLabel")}
              </dt>
              <dd>{t("now")}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {t("locationLabel")}
              </dt>
              <dd>{t("location")}</dd>
            </div>
          </dl>

          {showCv ? (
            <Button asChild size="sm">
              <a href={CV_PATH} download>
                <Download className="size-4" />
                {t("downloadCv")}
              </a>
            </Button>
          ) : null}
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl">{t("skillsTitle")}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {skills[locale].map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {group.title}
                </h3>
                <p className="text-sm leading-6 text-foreground/85">
                  {group.items.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl sm:text-3xl">{t("experienceTitle")}</h2>
          {experience[locale].map((entry) => (
            <article
              key={`${entry.company}-${entry.period}`}
              className="space-y-3"
            >
              <h3 className="text-xl leading-snug">{entry.role}</h3>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {entry.company} · {entry.location} · {entry.period}
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-foreground/85">
                {entry.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <p className="font-mono text-xs text-muted-foreground">
                {entry.stack.join(" · ")}
              </p>
            </article>
          ))}
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl">{t("communityTitle")}</h2>
          {community[locale].map((entry) => (
            <article
              key={`${entry.organization}-${entry.period}`}
              className="space-y-2"
            >
              <h3 className="text-lg leading-snug">
                {entry.organization} · {entry.role}
              </h3>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {entry.period}
              </p>
              <p className="text-sm leading-6 text-foreground/85">
                {entry.description}
              </p>
            </article>
          ))}
        </section>

        {talks.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-2xl sm:text-3xl">{t("speakingTitle")}</h2>
            <ul className="space-y-2">
              {talks.map((talk) => (
                <li
                  key={`${talk.event}-${talk.date}`}
                  className="font-mono text-sm text-foreground/85"
                >
                  {talk.event} · {talk.topic} · {talk.date}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-2xl sm:text-3xl">{t("certificatesTitle")}</h2>
          <ul className="space-y-4">
            {certificates[locale].map((certificate) => (
              <li key={certificate.name} className="space-y-1">
                <p className="text-base leading-6">
                  {certificate.name}
                  {certificate.verifyUrl ? (
                    <>
                      {" "}
                      <a
                        href={certificate.verifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline underline-offset-4"
                      >
                        {t("certificateVerify")}
                      </a>
                    </>
                  ) : null}
                </p>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {certificate.issuer}
                </p>
                {certificate.detail ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {certificate.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl sm:text-3xl">{t("educationTitle")}</h2>
          <ul className="space-y-3">
            {education[locale].map((entry) => (
              <li key={`${entry.school}-${entry.period}`} className="space-y-1">
                <p className="text-base leading-6">{entry.program}</p>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {entry.school} · {entry.period}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl sm:text-3xl">{t("languagesTitle")}</h2>
          <p className="section-copy">{t("languages")}</p>
        </section>
      </div>
    </div>
  );
}
