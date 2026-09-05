"use client";

import { useTranslations } from "next-intl";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { SocialLinks } from "./social-links";
import { isNavItemActive, navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface HeaderProps {
  // Passed straight through to the language switcher; see the comment on
  // LanguageSwitcherProps for the shape and for why it stays a plain Record
  // instead of importing TranslationMap from @/lib/content.
  translations: Record<string, Record<string, Record<string, string>>>;
}

export function Header({ translations }: HeaderProps) {
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
            className="tap-target group flex min-w-0 items-center no-underline"
          >
            {/* The lockup handles the phone rule itself; the link keeps the
                name as its accessible name because mark and tagline are
                aria-hidden inside it. */}
            <BrandLockup
              name={tBrand("name")}
              tagline={tBrand("tagline")}
              cursor="blink"
              responsive
            />
          </Link>
          {/* lg, not md: on an iPad in portrait (768 to 834px) the nav, the
              controls and these two icons together left the lockup no room
              and the name ellipsized; the footer carries the same links. */}
          <div className="hidden lg:block">
            <SocialLinks
              githubLabel={t("footer.github")}
              linkedinLabel={t("footer.linkedin")}
              newTabHint={t("a11y.opensInNewTab")}
            />
          </div>
        </div>

        {/* shrink-0, not min-w-0: the controls are fixed-size 44px targets,
            so letting this group shrink only pushed them past the viewport
            edge (8px at 320px before the mark existed). The brand group on
            the left is the side that gives way. */}
        <div className="flex shrink-0 items-center gap-3">
          <nav aria-label={t("nav.menu")} className="hidden md:block">
            <ul className="flex items-center gap-3 lg:gap-5">
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
            <LanguageSwitcher translations={translations} />
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
