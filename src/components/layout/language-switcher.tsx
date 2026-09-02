"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  fillPathname,
  pathnameForLocale,
  useParams,
  usePathname,
} from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { switchTargetPath } from "@/i18n/switch-target";
import { cn } from "@/lib/utils";

const localeLabels: Record<string, string> = {
  en: "EN",
  tr: "TR",
};

const localeNames: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
};

interface LanguageSwitcherProps {
  // Keyed by locale; see the comment on HeaderProps in header.tsx for why
  // this stays a plain Record instead of importing Locale from
  // @/lib/content.
  untranslated: Record<string, string[]>;
}

export function LanguageSwitcher({ untranslated }: LanguageSwitcherProps) {
  const activeLocale = useLocale();
  // usePathname returns the matched template on dynamic routes
  // (/blog/[slug]); fill it with the params so the comparison against the
  // untranslated list and the generated href both use the concrete path.
  const params = useParams();
  const pathname = fillPathname(usePathname(), params);
  const t = useTranslations("nav");

  // Default locale first: the site is Turkish on the root, so TR leads.
  const ordered = [
    routing.defaultLocale,
    ...routing.locales.filter((locale) => locale !== routing.defaultLocale),
  ];

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
        const target = switchTargetPath(pathname, untranslated[locale] ?? []);
        const href = pathnameForLocale(locale, target);
        return (
          <span key={locale} className="flex items-center">
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="h-3.5 w-px shrink-0 bg-border-strong"
              />
            ) : null}
            <a
              href={href}
              hrefLang={locale}
              lang={locale}
              aria-current={isActive ? "true" : undefined}
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
