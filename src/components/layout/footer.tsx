import { buildInfo, formatBuildSha } from "@/lib/build-info";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Mail, Rss } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { navItems } from "@/lib/nav";
import { localePath } from "@/lib/seo/alternates";
import {
  GithubIcon,
  LinkedinIcon,
  WhatsAppIcon,
} from "@/components/ui/brand-icon";
import { CONTACT_EMAIL_PUBLIC, SOCIAL, whatsappHref } from "@/lib/site";

// .tap-target, not the bare 24px floor SC 2.5.8 asks for: these are
// standalone links stacked in a column, not words inside a sentence, so the
// exception for inline targets does not cover them. The rows read taller for
// it, which is the cost of a thumb sized target on a phone.
const footerTextLinkClass =
  "tap-target inline-flex items-center gap-2 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground";

export async function Footer() {
  const year = buildInfo.year;
  const [t, tBrand, tContact, locale] = await Promise.all([
    getTranslations(),
    getTranslations("brand"),
    getTranslations("contact"),
    getLocale(),
  ]);
  const buildSha = formatBuildSha(buildInfo.sha);
  const buildDate = buildInfo.date;
  // feed.xml is a route handler, so it is not a next-intl Link target;
  // localePath still applies the as-needed prefix from the routing config.
  const feedHref = localePath(locale, "/feed.xml");

  return (
    <footer className="mt-auto border-t border-border">
      <div className="page-shell grid gap-10 py-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div className="space-y-3">
          {/* Same lockup as the header, cursor steady: two blinking cursors
              on one screen (sticky header plus footer) would be noise. */}
          <BrandLockup name={tBrand("name")} tagline={tBrand("tagline")} />
          <p className="eyebrow pt-2">{t("footer.availability")}</p>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("footer.tagline")}
          </p>
          <p className="pt-2 font-mono text-xs text-muted-foreground">
            {/* buildInfo.year is "" when NEXT_PUBLIC_BUILD_DATE was not set
                at build time (see src/lib/build-info.ts); the line reads
                fine without a year rather than guessing one at runtime. */}
            {`© ${year ? `${year} ` : ""}${tBrand("name")}. ${t("footer.copyright")}`}
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
          <nav aria-label={t("footer.navTitle")} className="min-w-0 space-y-2">
            <p className="meta-label">{t("footer.navTitle")}</p>
            <ul className="flex flex-col">
              {navItems.map(({ href, key }) => (
                <li key={href}>
                  <Link href={href} className={footerTextLinkClass}>
                    {t(key)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/privacy" className={footerTextLinkClass}>
                  {t("footer.privacy")}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="min-w-0 space-y-2">
            <p className="meta-label">{t("footer.emailLabel")}</p>
            <a
              href={`mailto:${CONTACT_EMAIL_PUBLIC}`}
              className="tap-target inline-flex min-w-0 items-center gap-2 break-all text-sm text-foreground transition-colors hover:text-primary"
            >
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">{CONTACT_EMAIL_PUBLIC}</span>
            </a>
            <p className="meta-label pt-3">{t("footer.elsewhereLabel")}</p>
            <ul className="flex flex-col">
              <li>
                <a
                  href={whatsappHref(tContact("whatsappPrefill"))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerTextLinkClass}
                >
                  <WhatsAppIcon className="size-4 shrink-0" />
                  {t("footer.whatsapp")}
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerTextLinkClass}
                >
                  <GithubIcon className="size-4 shrink-0" />
                  {t("footer.github")}
                </a>
              </li>
              <li>
                <a
                  href={SOCIAL.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerTextLinkClass}
                >
                  <LinkedinIcon className="size-4 shrink-0" />
                  {t("footer.linkedin")}
                </a>
              </li>
              <li>
                <a href={feedHref} className={footerTextLinkClass}>
                  <Rss className="size-4 shrink-0" aria-hidden="true" />
                  {t("footer.rss")}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
