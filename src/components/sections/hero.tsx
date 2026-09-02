import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/display-heading";
import { ProfileAvatar } from "@/components/ui/profile-avatar";

interface HeroProps {
  profileImageSrc?: string | null;
}

/**
 * Server rendered on purpose. The hero holds the LCP element, so it must never
 * depend on hydration to become visible: an entrance animation here printed
 * `opacity: 0` into the prerendered HTML and kept the largest paint waiting for
 * the client bundle. Nothing in this section is interactive, so it also keeps
 * the translation lookups out of the client bundle.
 *
 * The CV download lives on the About page only. Next to the availability badge
 * it read as a job application, and the first screen belongs to a visitor who
 * came to have work done.
 */
export async function Hero({ profileImageSrc }: HeroProps) {
  const t = await getTranslations();

  // Both metrics resolve on the About page: the years come from the work
  // history and the five applications are the BerrSoft delivery bullet. The
  // projects list holds a different five (the case studies), so pointing this
  // number there sent the reader to items that were never the ones counted.
  const metrics = [
    {
      label: t("hero.metricYearsLabel"),
      value: t("hero.metricYearsValue"),
      href: "/about" as const,
    },
    {
      label: t("hero.metricProjectsLabel"),
      value: t("hero.metricProjectsValue"),
      href: "/about" as const,
    },
  ];

  return (
    <section className="section-space">
      <div className="page-shell">
        <div className="max-w-3xl space-y-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="eyebrow">{t("hero.location")}</span>
            <span className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              <span
                aria-hidden="true"
                className="status-pulse size-1.5 rounded-full bg-status-up"
              />
              {t("hero.availableForWork")}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {profileImageSrc ? (
                <ProfileAvatar
                  src={profileImageSrc}
                  alt={t("brand.name")}
                  sizeClass="size-14 sm:size-16"
                />
              ) : null}
              <div className="min-w-0 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("brand.name")} · {t("brand.role")}
                </p>
                <DisplayHeading as="h1" size="hero" className="text-balance">
                  {t("hero.tagline")}
                </DisplayHeading>
                <p className="max-w-2xl section-copy">{t("hero.intro")}</p>
              </div>
            </div>
          </div>

          <div className="metric-strip">
            {metrics.map((metric) => (
              <div className="metric-cell" key={metric.label}>
                <p className="meta-label">{metric.label}</p>
                <p className="mt-1 font-mono text-2xl font-medium tabular-nums text-foreground sm:text-3xl">
                  {/* The visible link text is the metric value on its own, so
                      the accessible name restates the label it sits under. */}
                  <Link
                    href={metric.href}
                    prefetch={false}
                    aria-label={`${metric.label}: ${metric.value}`}
                    className="text-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {metric.value}
                  </Link>
                </p>
              </div>
            ))}
            <div className="metric-cell">
              <p className="meta-label">{t("hero.metricFocusLabel")}</p>
              <p className="mt-1 text-sm font-medium leading-snug text-foreground sm:text-base">
                {t("hero.metricFocusValue")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/projects">
                {t("hero.viewProjects")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/contact">{t("hero.getInTouch")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
