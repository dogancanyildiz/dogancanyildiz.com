import Image from "next/image";
import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LinkedinIcon, WhatsAppIcon, XIcon } from "@/components/ui/brand-icon";
import { CopyLinkButton } from "@/components/sections/copy-link-button";
import type { Locale } from "@/lib/content";
import { absoluteUrl, localePath } from "@/lib/seo/alternates";
import { OG_IMAGE_SIZE, ogImagePathFor } from "@/lib/seo/og-image";

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
  /** Locale relative path of the page being shared, e.g. /blog/a-slug. */
  path: string;
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
export async function ShareCard({ locale, path, title }: ShareCardProps) {
  const [t, tMeta] = await Promise.all([
    getTranslations("share"),
    getTranslations("metadata"),
  ]);

  const url = absoluteUrl(locale, path);
  // Locale relative, because the image sits under the page's own segment and
  // the browser is already on that locale; localePath applies the as-needed
  // prefix the metadata image route was generated with.
  const cardSrc = localePath(locale, ogImagePathFor(path));
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
        {links.map(({ key, label, href, icon }) => (
          <li key={key}>
            {/* mailto is not a document: a new tab for it is an empty tab
                left behind once the mail client opens, so only the three web
                targets leave the page. */}
            <a
              href={href}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel={
                href.startsWith("mailto:") ? undefined : "noopener noreferrer"
              }
              className={shareLinkClass}
            >
              {icon}
              {label}
            </a>
          </li>
        ))}
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
