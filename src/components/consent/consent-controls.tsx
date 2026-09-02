"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useConsent } from "./consent-provider";

/**
 * The standing measurement choice, and one button that flips it. GDPR 7(3)
 * and KVKK both want withdrawal to be as easy as giving consent, and the
 * banner is gone the moment it is answered, so this is the place the choice
 * stays reachable from.
 *
 * Renders nothing when analytics is not configured for the deployment: there
 * would be no script to allow or to withdraw, and offering the switch anyway
 * would claim something the site does not do.
 */
export function ConsentControls() {
  const t = useTranslations("consent");
  const { ready, choice, tag, setAnalytics } = useConsent();

  if (!tag || !ready) {
    return null;
  }

  const allowed = choice?.analytics === true;
  const state =
    choice === null
      ? t("manageUnset")
      : allowed
        ? t("manageAllowed")
        : t("manageDeclined");

  return (
    <div className="surface-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Polite live region: the sentence is the only confirmation that the
          button press did anything, and the button itself stays put. */}
      <p role="status" className="text-sm text-foreground">
        {state}
      </p>
      <Button
        type="button"
        size="sm"
        variant={allowed ? "outline" : "default"}
        className="tap-target self-start sm:self-auto"
        onClick={() => setAnalytics(!allowed)}
      >
        {allowed ? t("revoke") : t("accept")}
      </Button>
    </div>
  );
}
