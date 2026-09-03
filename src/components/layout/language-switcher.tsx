"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  SECTION_TEMPLATE,
  pathnameForLocale,
  useParams,
  usePathname,
} from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/routing";
import { UMAMI_EVENT, umamiEvent } from "@/lib/analytics-events";
import { cn } from "@/lib/utils";

const localeLabels: Record<string, string> = {
  en: "EN",
  tr: "TR",
};

const localeNames: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
};

type ContentKind = keyof typeof SECTION_TEMPLATE;

/**
 * First path segment of the two content sections, in every locale that has
 * a name for it. Reading the section off the segment rather than off the
 * matched template is what makes this component tolerant of the three shapes
 * usePathname() can return (see the comment on href below).
 */
const SECTION_KIND: Record<string, ContentKind> = {
  blog: "post",
  yazilar: "post",
  projects: "project",
  projeler: "project",
};

function sectionKind(pathname: string): ContentKind | null {
  const first = pathname.split("/")[1] ?? "";
  return SECTION_KIND[first] ?? null;
}

/**
 * Slug of the detail page being rendered, or null on a section root.
 *
 * useParams is the first source because it is the one value that is the same
 * on the server and in the browser. The second segment is only a fallback for
 * the pathological case of params not reaching the client, and a template
 * placeholder ("[slug]") is rejected there rather than treated as a slug.
 */
function currentSlug(
  pathname: string,
  params: ReturnType<typeof useParams>
): string | null {
  if (typeof params.slug === "string" && params.slug.length > 0) {
    return params.slug;
  }
  const [, , second] = pathname.split("/");
  if (!second || second.startsWith("[")) return null;
  return second;
}

interface LanguageSwitcherProps {
  // kind -> this locale's slug -> target locale -> that locale's public path,
  // from buildTranslationMap. Structurally src/lib/content.ts's
  // TranslationMap, spelled out here for the same reason HeaderProps spells
  // its prop out: the client boundary does not import the content layer or
  // its Locale type.
  translations: Record<string, Record<string, Record<string, string>>>;
}

export function LanguageSwitcher({ translations }: LanguageSwitcherProps) {
  const activeLocale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations("nav");

  // Default locale first: the site is Turkish on the root, so TR leads.
  const ordered = [
    routing.defaultLocale,
    ...routing.locales.filter((locale) => locale !== routing.defaultLocale),
  ];

  /**
   * usePathname() has no single shape here, so nothing below is derived from
   * one. On a Turkish detail page the server renders from the RSC payload's
   * canonical url, which is the internal route, and the hook returns the
   * concrete /blog/<tr-slug>; after hydration it reads window.location
   * (/yazilar/<tr-slug>) and next-intl's getRoute matches the Turkish
   * template and returns /blog/[slug]. Both shapes carry the same section
   * segment and the same route params, which is why the target is built from
   * those two and the server and the client agree on every href.
   *
   * The last branch is the only one that hands pathname to next-intl, and it
   * is only reached when the path is not a content section, so a dynamic
   * template can never get there: compileLocalizedPathname finds
   * /blog/[slug] in the map, has no params to fill it with and throws
   * "Insufficient params provided for localized pathname", which in a client
   * component takes the whole page down.
   */
  const href = (locale: AppLocale): string => {
    const kind = sectionKind(pathname);
    if (kind) {
      const slug = currentSlug(pathname, params);
      const mapped = slug ? translations[kind]?.[slug]?.[locale] : undefined;
      // No translation in that locale: the section root, never a 404.
      return mapped ?? pathnameForLocale(locale, SECTION_TEMPLATE[kind]);
    }
    return pathnameForLocale(locale, pathname);
  };

  return (
    <nav
      aria-label={t("languageLabel")}
      // Flat, like the nav links beside it: no pill, no box. The active
      // locale carries the foreground colour and a primary underline, the
      // hairline between the two is the same strong token the lockup uses.
      className="flex items-center font-mono"
    >
      {ordered.map((locale, index) => {
        const isActive = locale === activeLocale;
        return (
          <span key={locale} className="flex items-center">
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="h-3.5 w-px shrink-0 bg-border-strong"
              />
            ) : null}
            <a
              href={href(locale)}
              hrefLang={locale}
              lang={locale}
              aria-current={isActive ? "true" : undefined}
              // Only the other locale carries the event: a press on the
              // active one is a reload, not a switch.
              {...(isActive
                ? {}
                : umamiEvent(UMAMI_EVENT.localeSwitch, { to: locale }))}
              className={cn(
                "tap-target inline-flex items-center px-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors",
                isActive
                  ? "text-foreground underline decoration-primary decoration-2 underline-offset-8"
                  : "text-muted-foreground no-underline hover:text-foreground"
              )}
            >
              {localeLabels[locale]}
              <span className="sr-only"> ({localeNames[locale]})</span>
            </a>
          </span>
        );
      })}
    </nav>
  );
}
