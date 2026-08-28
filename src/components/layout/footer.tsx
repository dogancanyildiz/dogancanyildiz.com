import { buildInfo, formatBuildSha } from "@/lib/build-info";
import { Mail, Rss } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { navItems } from "@/lib/nav";
import { routing } from "@/i18n/routing";
import { CONTACT_EMAIL_PUBLIC, SOCIAL } from "@/lib/site";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icon";

export async function Footer() {
  const year = buildInfo.year;
  const [t, tBrand, locale] = await Promise.all([
    getTranslations(),
    getTranslations("brand"),
    getLocale(),
  ]);
  const buildSha = formatBuildSha(buildInfo.sha);
  const buildDate = buildInfo.date;
  // feed.xml is a route handler, not an i18n page route, so it is linked
  // directly rather than through the next-intl Link helper.
  const feedHref =
    locale === routing.defaultLocale ? "/feed.xml" : `/${locale}/feed.xml`;

  return (
    <footer className="mt-auto border-t border-border">
      <div className="page-shell grid gap-10 py-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div className="space-y-3">
          <p className="eyebrow">{t("footer.availability")}</p>
          <h2 className="section-heading">{tBrand("name")}</h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("footer.tagline")}
          </p>
          <p className="pt-2 font-mono text-xs text-muted-foreground">
            © {year} {tBrand("name")}. {t("footer.copyright")}
          </p>
          <div className="space-y-1 pt-3 font-mono text-xs text-muted-foreground">
            <p>{t("footer.selfHosted")}</p>
            {buildDate || buildSha ? (
              <p>
                {buildDate
                  ? t("footer.lastUpdated", { date: buildDate })
                  : null}
                {buildDate && buildSha ? (
                  <span aria-hidden="true"> · </span>
                ) : null}
                {buildSha ? <span>{buildSha}</span> : null}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid min-w-0 gap-8 sm:grid-cols-2">
          <nav aria-label={t("footer.navTitle")} className="min-w-0 space-y-3">
            <p className="meta-label">{t("footer.navTitle")}</p>
            <ul className="flex flex-col gap-1">
              {navItems.map(({ href, key }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="tap-target inline-flex items-center text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 space-y-3">
            <p className="meta-label">{t("footer.emailLabel")}</p>
            <a
              href={`mailto:${CONTACT_EMAIL_PUBLIC}`}
              className="tap-target inline-flex min-w-0 items-center gap-2 break-all text-sm text-foreground transition-colors hover:text-primary"
            >
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">{CONTACT_EMAIL_PUBLIC}</span>
            </a>
            <p className="meta-label pt-3">{t("footer.elsewhereLabel")}</p>
            <div className="flex items-center gap-4">
              <a
                href={SOCIAL.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.github")}
                className="tap-target text-muted-foreground transition-colors hover:text-foreground"
              >
                <GithubIcon className="size-4" />
              </a>
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.linkedin")}
                className="tap-target text-muted-foreground transition-colors hover:text-foreground"
              >
                <LinkedinIcon className="size-4" />
              </a>
              <a
                href={feedHref}
                aria-label={t("footer.rss")}
                className="tap-target text-muted-foreground transition-colors hover:text-foreground"
              >
                <Rss className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
