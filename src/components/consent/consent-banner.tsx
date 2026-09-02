"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useConsent } from "./consent-provider";

/**
 * Asks once whether visit counts may load. Hidden when analytics is not
 * configured, or when a choice is already stored.
 *
 * A landmark region, not a dialog: nothing here traps focus, nothing closes
 * on Escape and the page behind it stays fully usable, so role="dialog"
 * would promise a screen reader an interaction model the banner does not
 * implement. The choice itself is never lost by ignoring the banner; it can
 * be made or changed later on /privacy.
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const { ready, choice, tag, setAnalytics } = useConsent();

  if (!tag || !ready || choice !== null) {
    return null;
  }

  return (
    <div
      role="region"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 backdrop-blur-md sm:p-5"
    >
      <div className="page-shell flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl space-y-2">
          <p id="consent-title" className="text-sm font-medium text-foreground">
            {t("title")}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("body")}{" "}
            <Link
              href="/privacy"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("privacy")}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="tap-target"
            onClick={() => setAnalytics(true)}
          >
            {t("accept")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="tap-target"
            onClick={() => setAnalytics(false)}
          >
            {t("reject")}
          </Button>
        </div>
      </div>
    </div>
  );
}
