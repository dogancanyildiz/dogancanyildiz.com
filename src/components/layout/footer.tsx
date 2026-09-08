import { buildInfo, formatBuildSha } from "@/lib/build-info";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Mail, Rss } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { navItems } from "@/lib/nav";
import { localePath } from "@/lib/seo/alternates";
import { WhatsAppIcon } from "@/components/ui/brand-icon";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { PROFILE_ICONS } from "@/components/layout/social-links";
import {
  CONTACT_EMAIL_PUBLIC,
  SOCIAL_PROFILES,
  whatsappHref,
} from "@/lib/site";
import { UMAMI_EVENT, outboundEvent, umamiEvent } from "@/lib/analytics-events";

// .tap-target, not the bare 24px floor SC 2.5.8 asks for: these are
// standalone links stacked in a column, not words inside a sentence, so the
// exception for inline targets does not cover them. The rows read taller for
// it, which is the cost of a thumb sized target on a phone.
const footerTextLinkClass =
  "tap-target inline-flex items-center gap-2 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground";

/** "" stays "", a valid instant is formatted, anything else is returned as is. */
export function formatBuildDate(
  raw: string,
  render: (value: Date) => string
): string {
  if (!raw) return "";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : render(parsed);
}

export async function Footer() {
  const year = buildInfo.year;
  const [t, tBrand, tContact, locale, format] = await Promise.all([
    getTranslations(),
    getTranslations("brand"),
    getTranslations("contact"),
    getLocale(),
    getFormatter(),
  ]);
  const buildSha = formatBuildSha(buildInfo.sha);
  // The build stamp is a UTC instant ("2026-09-05T16:59:07Z"). Printed as a
  // date in Istanbul time, the way the Systems panel does, so the footer
  // reads "5 Eylül 2026" rather than the raw ISO string. A stamp that does
  // not parse (a hand set value) falls back to the raw text instead of
  // printing "Invalid Date".
  const buildDate = formatBuildDate(buildInfo.date, (value) =>
    format.dateTime(value, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Europe/Istanbul",
    })
  );
  // feed.xml is a route handler, so it is not a next-intl Link target;
  // localePath still applies the as-needed prefix from the routing config.
  const feedHref = localePath(locale, "/feed.xml");

  return (
    <footer className="mt-auto border-t border-border">
      <div className="page-shell grid gap-10 py-10 lg:grid-cols-[1.1fr_1.6fr] lg:gap-16">
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

        {/* Phone: pages and profiles side by side (seven and eight rows,
            about even), contact on its own full width row so the email
            never breaks mid-word in a half column. From sm up the three
            columns sit in reading order: pages, contact, profiles. */}
        <div className="grid min-w-0 grid-cols-2 gap-8 sm:grid-cols-3">
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

          <div className="order-last col-span-2 min-w-0 space-y-2 sm:order-none sm:col-span-1">
            <p className="meta-label">{t("footer.contactLabel")}</p>
            <ul className="flex flex-col">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL_PUBLIC}`}
                  className="tap-target inline-flex min-w-0 items-center gap-2 break-all text-sm text-foreground transition-colors hover:text-primary"
                  {...outboundEvent(`mailto:${CONTACT_EMAIL_PUBLIC}`)}
                >
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">{CONTACT_EMAIL_PUBLIC}</span>
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref(tContact("whatsappPrefill"))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerTextLinkClass}
                  {...umamiEvent(UMAMI_EVENT.whatsappClick, {
                    surface: "footer",
                  })}
                >
                  <WhatsAppIcon className="size-4 shrink-0" />
                  {t("footer.whatsapp")}
                  <NewTabHint text={t("a11y.opensInNewTab")} />
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

          {/* The same list the About page groups, flat here: a footer column
              is a directory, not a pitch. Derived from SOCIAL_PROFILES so it
              cannot drift from the Person node's sameAs; rel="me" marks each
              as this person's own profile for crawlers that read it. */}
          <nav
            aria-label={t("footer.profilesLabel")}
            className="min-w-0 space-y-2"
          >
            <p className="meta-label">{t("footer.profilesLabel")}</p>
            <ul className="flex flex-col">
              {SOCIAL_PROFILES.map((profile) => {
                const Icon = PROFILE_ICONS[profile.id];
                return (
                  <li key={profile.id}>
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="me noopener noreferrer"
                      className={footerTextLinkClass}
                      {...outboundEvent(profile.url)}
                    >
                      <Icon className="size-4 shrink-0" />
                      {profile.label}
                      <NewTabHint text={t("a11y.opensInNewTab")} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
