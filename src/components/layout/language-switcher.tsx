"use client";

import { useLocale, useTranslations } from "next-intl";
import { getPathname, usePathname } from "@/i18n/navigation";
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
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav
      aria-label={t("languageLabel")}
      className="flex rounded-full border border-border/70 bg-background/60 p-1"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === activeLocale;
        // If the current page has no translation in the target locale,
        // switchTargetPath falls back to that locale's section root instead
        // of a path that 404s. getPathname then applies localePrefix
        // "as-needed" as configured, so the English link is /about and not
        // /en/about, which the proxy would answer with a 307. Link forces
        // the prefix whenever an explicit locale is passed. A plain anchor
        // is enough here: switching the language reloads the whole tree
        // anyway.
        const target = switchTargetPath(pathname, untranslated[locale] ?? []);
        const href = getPathname({ locale, href: target });
        return (
          <a
            key={locale}
            href={href}
            hrefLang={locale}
            aria-current={isActive ? "true" : undefined}
            aria-label={localeNames[locale]}
            className={cn(
              "inline-flex h-8 items-center rounded-full px-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em] no-underline transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {localeLabels[locale]}
          </a>
        );
      })}
    </nav>
  );
}
