"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex rounded-md border border-border bg-muted/30 p-0.5">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-2.5 text-xs font-medium",
          locale === "en" && "bg-background shadow-xs"
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
          "h-7 px-2.5 text-xs font-medium",
          locale === "tr" && "bg-background shadow-xs"
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
