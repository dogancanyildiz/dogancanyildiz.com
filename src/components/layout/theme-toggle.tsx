"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UMAMI_EVENT, umamiEvent } from "@/lib/analytics-events";

/**
 * A single render path for every mount state. The icon swap is a pure CSS
 * dark: variant, driven by the .dark class next-themes' blocking script sets
 * on <html> before hydration, so the button never changes box size or icon
 * between the server render and the hydrated client render. Before
 * resolvedTheme settles (its first read is undefined) aria-pressed reads
 * false, which matches what the CSS variant already shows by default.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations();
  // What the press will switch to, which is also what the event records.
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      // Flat like the language switcher: the icon is the control, no box.
      className="tap-target rounded-md"
      aria-label={t("a11y.toggleTheme")}
      aria-pressed={resolvedTheme === "dark"}
      onClick={() => setTheme(nextTheme)}
      {...umamiEvent(UMAMI_EVENT.themeToggle, { to: nextTheme })}
    >
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  );
}
