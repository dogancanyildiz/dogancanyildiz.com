"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A single render path for every mount state. The icon swap is a pure CSS
 * dark: variant, driven by the .dark class next-themes' blocking script sets
 * on <html> before hydration, so the button never changes box size, border
 * or icon between the server render and the hydrated client render. Before
 * resolvedTheme settles (its first read is undefined) aria-pressed reads
 * false, which matches what the CSS variant already shows by default.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="tap-target border border-border bg-background"
      aria-label={t("a11y.toggleTheme")}
      aria-pressed={resolvedTheme === "dark"}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  );
}
