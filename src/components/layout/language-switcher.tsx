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
      className="flex rounded-full border border-border-strong bg-background/60 p-1"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === activeLocale;
        const target = switchTargetPath(pathname, untranslated[locale] ?? []);
        const href = getPathname({ locale, href: target });
        return (
          <a
            key={locale}
            href={href}
            hrefLang={locale}
            lang={locale}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "tap-target inline-flex items-center rounded-full px-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em] no-underline transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {localeLabels[locale]}
            <span className="sr-only"> ({localeNames[locale]})</span>
          </a>
        );
      })}
    </nav>
  );
}
