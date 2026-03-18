"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex rounded-full border border-border/70 bg-background/60 p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 rounded-full px-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em]",
          locale === "en" && "bg-accent/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        )}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label="English"
      >
        <motion.span
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          EN
        </motion.span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 rounded-full px-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em]",
          locale === "tr" && "bg-accent/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        )}
        onClick={() => setLocale("tr")}
        aria-pressed={locale === "tr"}
        aria-label="Türkçe"
      >
        <motion.span
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          TR
        </motion.span>
      </Button>
    </div>
  );
}
