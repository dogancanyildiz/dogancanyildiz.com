import type { ComponentProps, ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppHref } from "@/i18n/navigation";
import { NewTabHint } from "@/components/ui/new-tab-hint";

/**
 * Element overrides handed to every compiled MDX body.
 *
 * The two shortcodes that used to live here (ProjectMeta, Screenshot) were
 * removed: no content file ever used them, they were not part of the content
 * strategy in docs/08-icerik-stratejisi.md or the Faz 4 plan, and reaching
 * them through the component map cost two `as unknown as` casts. If a case
 * study needs an in-body meta grid later, it should arrive with the content
 * that needs it and with translated labels.
 */

/**
 * A same-site link written in an MDX body is a plain `<a>` after compilation,
 * so it navigates with a full page reload and steps outside next-intl's typed
 * pathnames and locale prefix. Routing internal links through the next-intl
 * Link keeps navigation client-side and locale-correct; external links
 * (http, mailto, tel, //host) and bare anchors (#id) stay ordinary anchors.
 *
 * An internal href is a same-locale public path already: a tr file writes the
 * tr path (/hakkimda, /projeler/...), an en file writes the en path
 * (/about, /projects/...). next-intl localizes what it recognizes and adds the
 * /en prefix only on the English locale, so each file's own path renders
 * unchanged on tr and picks up /en on en, without any double prefixing.
 *
 * velite.config.ts runs every external link through rehype-external-links,
 * which sets target="_blank" and rel="noopener noreferrer" at compile time
 * (R3-19 needs a screen reader warned before it leaves the page, and no
 * content author should have to remember either attribute by hand). That
 * target lands here in `rest`, so a NewTabHint child rides along with it
 * automatically for every external link an MDX body writes.
 */
function MdxLink({ href, children, ...rest }: ComponentProps<"a">) {
  // Called unconditionally, before either return, per the rules of hooks.
  // next-intl resolves this from the request scope: MDXContent
  // (src/components/content/mdx-content.tsx) is server-only and always
  // rendered inside a page that already called setRequestLocale.
  const t = useTranslations("a11y");
  if (
    typeof href === "string" &&
    href.startsWith("/") &&
    !href.startsWith("//")
  ) {
    // MDX passes href as a plain string, but the typed Link narrows it to the
    // known pathname union. Concrete content paths (/projeler/<slug>) are not
    // union members, so the cast mirrors pathnameForLocale in i18n/navigation.
    return (
      <Link href={href as AppHref} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
      {rest.target === "_blank" ? (
        <NewTabHint text={t("opensInNewTab")} />
      ) : null}
    </a>
  );
}

/**
 * A table wider than the prose column has to scroll inside its own box.
 * Without the wrapper the whole document scrolls sideways on a phone, which
 * moves the body text out from under the reader.
 */
function MdxTable(props: ComponentProps<"table">) {
  // Every prop is forwarded rather than only children: remark hands the table
  // whatever the markdown produced (align, className, a generated id), and
  // dropping those silently changes the rendering of a table that used them.
  return (
    <div className="table-wrap">
      <table {...props} />
    </div>
  );
}

export const mdxComponents: Record<
  string,
  ComponentType<Record<string, unknown>>
> = {
  table: MdxTable,
  a: MdxLink,
};
