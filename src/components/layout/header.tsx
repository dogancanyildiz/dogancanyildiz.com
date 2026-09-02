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
            {/* The owner's lockup: mark, hairline, the name over a mono
                tagline. Mark and tagline are decorative, so the link's
                accessible name is the name alone. Below 480px the row cannot
                hold the lockup next to the 44px controls (measured with device
                emulation), so only the mark shows there and the first span
                keeps the name for assistive tech; from 480px up the second
                block is the visible one. */}
            <BrandMark
              height={24}
              cursor="blink"
              className="shrink-0 text-foreground"
            />
            <span className="sr-only min-[480px]:hidden">{tBrand("name")}</span>
            <span className="hidden min-w-0 items-center gap-2.5 min-[480px]:flex">
              <span
                aria-hidden="true"
                className="h-7 w-px shrink-0 bg-border-strong"
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[15px] leading-none font-medium tracking-tight text-foreground">
                  {tBrand("name")}
                </span>
                <span
                  aria-hidden="true"
                  className="truncate font-mono text-[11px] leading-none tracking-wide text-primary"
                >
                  {tBrand("tagline")}
                </span>
              </span>
            </span>
          </Link>
          {/* lg, not md: on an iPad in portrait (768 to 834px) the nav, the
              controls and these two icons together left the lockup no room
              and the name ellipsized; the footer carries the same links. */}
          <div className="hidden lg:block">
            <SocialLinks
              githubLabel={t("footer.github")}
              linkedinLabel={t("footer.linkedin")}
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
            <LanguageSwitcher untranslated={untranslated} />
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
