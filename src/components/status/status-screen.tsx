import type { Locale } from "@/lib/content";
import { localePath } from "@/lib/seo/alternates";

export type StatusVariant = "notFound" | "construction" | "updating";

export interface StatusLink {
  href: string;
  label: string;
  hrefLang?: string;
  lang?: string;
  primary?: boolean;
}

export interface StatusScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  brandName?: string;
  extra?: React.ReactNode;
  links: StatusLink[];
}

const SECONDARY_PATHS = [
  { path: "/projects", key: "projects" },
  { path: "/blog", key: "blog" },
  { path: "/contact", key: "contact" },
] as const;

/**
 * Locale-prefixed hrefs for a status page. Uses localePath so a Turkish
 * 404 never sends the reader to the English home by accident.
 */
export function statusLinksFor(
  locale: Locale,
  labels: {
    home: string;
    projects: string;
    blog: string;
    contact: string;
  }
): StatusLink[] {
  return [
    {
      href: localePath(locale, "/"),
      label: labels.home,
      primary: true,
    },
    ...SECONDARY_PATHS.map((item) => ({
      href: localePath(locale, item.path),
      label: labels[item.key],
    })),
  ];
}

/**
 * Shared shell for 404, construction and updating. Native anchors only: the
 * global 404 document has no next-intl Link context.
 */
export function StatusScreen({
  eyebrow,
  title,
  description,
  brandName,
  extra,
  links,
}: StatusScreenProps) {
  const primary = links.filter((link) => link.primary);
  const secondary = links.filter((link) => !link.primary);

  return (
    <div className="flex flex-col items-start gap-6">
      {brandName ? (
        <p className="text-sm font-medium tracking-tight text-foreground">
          {brandName}
        </p>
      ) : null}
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="max-w-3xl page-title">{title}</h1>
      <p className="max-w-xl text-lg leading-8 text-muted-foreground">
        {description}
      </p>
      {extra}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-5">
          {primary.map((link) => (
            <a
              key={link.href}
              className="tap-target text-base font-semibold text-primary underline-offset-4 hover:underline"
              href={link.href}
              hrefLang={link.hrefLang}
              lang={link.lang}
            >
              {link.label}
            </a>
          ))}
        </div>
        {secondary.length > 0 ? (
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {secondary.map((link) => (
              <li key={`${link.href}:${link.label}`}>
                <a
                  className="tap-target text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  href={link.href}
                  hrefLang={link.hrefLang}
                  lang={link.lang}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
