import Image from "next/image";
import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ogImageHref } from "@/i18n/navigation";
import { LinkedinIcon, WhatsAppIcon, XIcon } from "@/components/ui/brand-icon";
import { CopyLinkButton } from "@/components/sections/copy-link-button";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { outboundEvent } from "@/lib/analytics-events";
import type { ContentKind, Locale } from "@/lib/content";
import { contentUrl } from "@/lib/seo/alternates";
import { OG_IMAGE_SIZE } from "@/lib/seo/og-image";

/**
 * Same shape as the footer's text links (see footerTextLinkClass in
 * src/components/layout/footer.tsx): plain text with a mark in front, no pill
 * and no button chrome, on a 44px target. These are standalone links in a row
 * rather than words inside a sentence, so the inline exception to WCAG 2.2
 * SC 2.5.8 does not cover them.
 */
const shareLinkClass =
  "tap-target inline-flex items-center gap-2 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground";

interface ShareCardProps {
  locale: Locale;
  /** Which content section the page being shared belongs to. */
  kind: ContentKind;
  /** That content's slug in this locale. */
  slug: string;
  /** The page's own title; goes into the prefilled share text. */
  title: string;
}

/**
 * The block that shows a page its own OpenGraph card and hands over the links
 * that would post it.
 *
 * The card was only ever named in og:image, twitter:image and the JSON-LD, so
 * the one audience that never saw it was the reader deciding whether to pass
 * the page on. It is the page's real card, served from the same metadata image
 * route the crawlers read, not a mockup that can drift from it.
 */
export async function ShareCard({ locale, kind, slug, title }: ShareCardProps) {
  const [t, tMeta, tA11y] = await Promise.all([
    getTranslations("share"),
    getTranslations("metadata"),
    getTranslations("a11y"),
  ]);
  const newTabHint = tA11y("opensInNewTab");

  const url = contentUrl(locale, kind, slug);
  // Already locale prefixed: ogImageHref goes through the same localized
  // template the page itself renders at, so this is the exact path the
  // metadata image route was generated with.
  const cardSrc = ogImageHref(locale, kind, slug);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      key: "x",
      label: t("x"),
      href: `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`,
      icon: <XIcon className="size-4 shrink-0" />,
    },
    {
      key: "linkedin",
      label: t("linkedin"),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <LinkedinIcon className="size-4 shrink-0" />,
    },
    {
      // wa.me with no number is the generic share sheet, which is the one
      // wanted here. whatsappHref in src/lib/site.ts opens a chat with the
      // owner instead and would turn "share this page" into "message me".
      key: "whatsapp",
      label: t("whatsapp"),
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      icon: <WhatsAppIcon className="size-4 shrink-0" />,
    },
    {
      key: "email",
      label: t("email"),
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: <Mail className="size-4 shrink-0" aria-hidden="true" />,
    },
  ];

  return (
    <section
      aria-labelledby="share-heading"
      className="space-y-4 border-t border-border pt-8"
    >
      <div className="space-y-1.5">
        <h2 id="share-heading" className="meta-label">
          {t("title")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("lead")}
        </p>
      </div>

      <Image
        src={cardSrc}
        // The same string the card itself is published with, from one key:
        // a second wording here would describe the image to a screen reader
        // differently than to a crawler.
        alt={tMeta("ogAltPage", { title })}
        width={OG_IMAGE_SIZE.width}
        height={OG_IMAGE_SIZE.height}
        // The optimizer would re-encode a PNG that a route in this same app
        // just rendered, at a size it is already served in. h-auto goes with
        // the w-full: without it the intrinsic height attribute survives the
        // width override and the 1200:630 ratio breaks.
        unoptimized
        loading="lazy"
        className="h-auto w-full max-w-[35rem] rounded-md border border-border"
      />

      <ul className="flex flex-wrap items-center gap-x-5">
        {links.map(({ key, label, href, icon }) => {
          // mailto is not a document: a new tab for it is an empty tab left
          // behind once the mail client opens, so only the three web targets
          // leave the page, and only they get the new-tab warning.
          const opensNewTab = !href.startsWith("mailto:");
          return (
            <li key={key}>
              <a
                href={href}
                target={opensNewTab ? "_blank" : undefined}
                rel={opensNewTab ? "noopener noreferrer" : undefined}
                className={shareLinkClass}
                // outbound rather than a share event of its own: the host is
                // already the network being shared to, and wa.me here is the
                // generic share sheet rather than the owner's own chat.
                {...outboundEvent(href)}
              >
                {icon}
                {label}
                {opensNewTab ? <NewTabHint text={newTabHint} /> : null}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-x-4">
        <CopyLinkButton
          url={url}
          label={t("copy")}
          copiedLabel={t("copied")}
          failedLabel={t("copyFailed")}
          className={shareLinkClass}
        />
        {/* Printed whatever the clipboard does, so a reader whose browser
            refuses the write still has the address to select by hand. */}
        <span className="min-w-0 font-mono text-xs break-words text-muted-foreground [overflow-wrap:anywhere]">
          {url}
        </span>
      </div>
    </section>
  );
}
