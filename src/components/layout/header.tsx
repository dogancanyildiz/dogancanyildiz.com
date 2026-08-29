"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { isNavItemActive, navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface HeaderProps {
  untranslated: Record<string, string[]>;
}

export function Header({ untranslated }: HeaderProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const tBrand = useTranslations("brand");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 no-underline"
        >
          <span className="font-mono text-xs font-semibold tracking-[0.12em] text-foreground">
            {tBrand("monogram")}
          </span>
          <span className="sr-only">{tBrand("name")}</span>
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          <nav aria-label={t("nav.menu")} className="hidden md:block">
            <ul className="flex items-center gap-5">
              {navItems.map(({ href, key }) => {
                const isActive = isNavItemActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "tap-target relative flex items-center text-sm no-underline transition-colors",
                        isActive
                          ? "font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {/* Its own <nav aria-label="Language">, so it sits beside the
              primary nav rather than inside it to avoid nesting landmarks. */}
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher untranslated={untranslated} />
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
