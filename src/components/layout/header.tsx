"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  // Keyed by locale. Kept as a plain Record<string, string[]> instead of
  // Record<Locale, string[]> so this client component never imports
  // @/lib/content, which would pull the velite JSON into the client bundle.
  untranslated: Record<string, string[]>;
}

export function Header({ untranslated }: HeaderProps) {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <nav
        aria-label={t("nav.menu")}
        className="page-shell surface-panel flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-5"
      >
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 no-underline"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl border border-border bg-muted font-mono text-[0.7rem] font-semibold tracking-[0.06em] text-foreground">
            DCY
          </span>
          <span className="min-w-0">
            <span className="block truncate font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Portfolio
            </span>
            <span className="text-lg text-foreground transition-colors group-hover:text-primary">
              {t("brand")}
            </span>
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <ul className="hidden items-center gap-1 rounded-full border border-border bg-background p-1 md:flex">
            {navItems.map(({ href, key }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-9 items-center rounded-full px-4 text-sm font-medium no-underline transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2">
            <LanguageSwitcher untranslated={untranslated} />
            <ThemeToggle />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/contact">
                {t("nav.contact")}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}
