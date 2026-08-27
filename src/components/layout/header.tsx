"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { navItems } from "@/lib/nav";
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
      <nav
        aria-label={t("nav.menu")}
        className="page-shell flex h-14 items-center justify-between gap-4"
      >
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 no-underline"
          aria-label={tBrand("name")}
        >
          <span className="font-mono text-xs font-semibold tracking-[0.12em] text-foreground">
            {tBrand("monogram")}
          </span>
          <span className="sr-only">{tBrand("name")}</span>
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          <ul className="hidden items-center gap-5 md:flex">
            {navItems.map(({ href, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={
                    href === "/"
                      ? pathname === "/"
                        ? "page"
                        : undefined
                      : pathname.startsWith(href)
                        ? "page"
                        : undefined
                  }
                  className={cn(
                    "tap-target relative flex items-center text-sm no-underline transition-colors",
                    (href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(href))
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher untranslated={untranslated} />
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
