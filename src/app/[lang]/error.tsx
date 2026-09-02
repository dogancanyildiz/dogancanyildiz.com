"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/layout/page-section";

/**
 * Error boundary for everything under the locale layout.
 *
 * Without this file an uncaught render error fell through to Next's own
 * screen: no header, no footer, no stylesheet, English only. The boundary
 * sits below the layout, so the shell and the translations are still
 * available here.
 *
 * `retry` (stable since Next 16.3) re-fetches and re-renders the segment.
 * `reset` only clears the boundary state without refetching, which for a
 * server rendered page means it usually fails again on the same data.
 */
export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    // The server already logged the original error; this is the client half,
    // and the digest is what ties the two together.
    console.error(error);
  }, [error]);

  return (
    <PageSection>
      <div className="flex max-w-2xl flex-col items-start gap-6">
        <h1 className="page-title">{t("title")}</h1>
        <p className="section-copy">{t("description")}</p>
        {error.digest ? (
          <p className="meta-label">
            {t("digestLabel")}: <code>{error.digest}</code>
          </p>
        ) : null}
        {/* size="sm" is a 36px box. These two are the only way off a crashed
            page, so they take the same 44px floor every other standalone
            control on the site does. */}
        <div className="flex flex-wrap gap-3">
          <Button size="sm" className="tap-target" onClick={() => retry()}>
            {t("retry")}
          </Button>
          <Button asChild variant="outline" size="sm" className="tap-target">
            <Link href="/">{t("backHome")}</Link>
          </Button>
        </div>
      </div>
    </PageSection>
  );
}
