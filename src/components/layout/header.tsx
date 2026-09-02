"use client";

import { useTranslations } from "next-intl";
import { BrandMark } from "@/components/brand/brand-mark";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { SocialLinks } from "./social-links";
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
        <div className="flex min-w-0 items-center gap-1">
          {/* tap-target costs nothing visually inside the h-16 row, and the
              brand link is a standalone control like every other one here. */}
          <Link
            href="/"
            className="tap-target group flex min-w-0 items-center gap-2.5 no-underline"
          >
            {/* Decorative, so the link keeps the name as its accessible
                name. shrink-0 on the mark and truncate on the name: with the
                mark beside it the block is wide enough that a 320px viewport
                runs out of row, and without truncate the name wraps inside
                h-16 instead of ellipsizing. */}
            <BrandMark height={18} className="shrink-0 text-foreground" />
            <span className="truncate text-sm font-medium tracking-tight text-foreground">
              {tBrand("name")}
            </span>
          </Link>
          <div className="hidden md:block">
            <SocialLinks
              githubLabel={t("footer.github")}
              linkedinLabel={t("footer.linkedin")}
            />
          </div>
        </div>

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
