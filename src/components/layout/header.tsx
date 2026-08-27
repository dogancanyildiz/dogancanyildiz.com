"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navKeys = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/projects", key: "nav.projects" },
  { href: "/contact", key: "nav.contact" },
] as const;

export function Header() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <nav className="page-shell surface-panel flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 no-underline"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl border border-border bg-muted font-mono text-[0.7rem] font-semibold tracking-[0.06em] text-foreground">
            DCY
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Portfolio
            </span>
            <span className="font-display text-lg text-foreground transition-colors group-hover:text-primary">
              {t("brand")}
            </span>
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <ul className="hidden items-center gap-1 rounded-full border border-border/70 bg-background/65 p-1 md:flex">
            {navKeys.map(({ href, key }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-accent/70"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.4,
                        }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/contact">
                {t("nav.contact")}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
