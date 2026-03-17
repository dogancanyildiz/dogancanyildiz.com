"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const navKeys = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/projects", key: "nav.projects" },
  { href: "/contact", key: "nav.contact" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-semibold text-foreground no-underline hover:text-foreground/80"
        >
          {t("brand")}
        </Link>
        <ul className="flex items-center gap-1">
          {navKeys.map(({ href, key }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-md bg-accent"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  {t(key)}
                </Link>
              </li>
            );
          })}
          <li className="ml-2 flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </li>
        </ul>
      </nav>
    </header>
  );
}
