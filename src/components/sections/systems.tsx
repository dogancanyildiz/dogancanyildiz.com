import { Suspense } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { buildInfo, formatBuildSha } from "@/lib/build-info";
import { getSiteStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

/**
 * Hard-coded on purpose. This line names technologies, never machines: no
 * hostname, no port, no internal service address, no IP.
 */
const STACK = [
  "Next.js",
  "Docker",
  "Coolify",
  "Traefik",
  "Cloudflare",
] as const;

/**
 * Candidates for a later version, taken from docs/05-backend-icerik-ve-servisler.md
 * ("Ileride eklenebilecekler"). None of them is required today and none of them
 * may introduce a hostname, port, IP or internal service name:
 *   - total number of monitored services, as an aggregate count only
 *   - a link to the public status page itself
 *   - a link to the Umami instance
 *   - uptime of other public projects such as Cargo Pilot
 *   - 30 day uptime trend
 *   - deploy frequency, "N deploys in the last 30 days"
 *   - publication date of the most recent blog post
 *   - GitHub commit activity through the public GitHub API
 */

/**
 * Both timestamps rendered below (deploy date, last check) are UTC instants
 * from CI / Gatus. `timeZoneName: "short"` spells that out for every visitor
 * instead of silently showing a time that looks local but is not.
 */
const DATE_FORMAT = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
} as const;

function SystemsNotice({ label }: { label: string }) {
  return (
    <div className="surface-panel p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function SystemsField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

async function SystemsPanel() {
  const [t, format, status] = await Promise.all([
    getTranslations("systems"),
    getFormatter(),
    getSiteStatus(),
  ]);
  const buildSha = buildInfo.sha ? formatBuildSha(buildInfo.sha) : null;
  const parsedBuildDate = buildInfo.date.trim()
    ? new Date(buildInfo.date)
    : null;
  const buildDate =
    parsedBuildDate && !Number.isNaN(parsedBuildDate.getTime())
      ? parsedBuildDate
      : null;

  if (!status) {
    return <SystemsNotice label={t("unavailable")} />;
  }

  return (
    <div className="surface-panel space-y-6 p-6">
      <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SystemsField label={t("siteLabel")}>
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                status.up ? "bg-primary" : "bg-destructive"
              )}
            />
            {status.up ? t("up") : t("down")}
          </span>
        </SystemsField>

        <SystemsField label={t("uptimeLabel")}>
          {status.uptime24h === null
            ? t("noData")
            : format.number(status.uptime24h / 100, {
                style: "percent",
                maximumFractionDigits: 2,
              })}
        </SystemsField>

        <SystemsField label={t("deployLabel")}>
          {buildDate ? format.dateTime(buildDate, DATE_FORMAT) : t("noData")}
        </SystemsField>

        <SystemsField label={t("commitLabel")}>
          <span className="font-mono">{buildSha ?? t("noData")}</span>
        </SystemsField>

        <div className="space-y-2 sm:col-span-2 lg:col-span-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {t("stackLabel")}
          </dt>
          <dd className="text-sm font-medium text-foreground">
            {STACK.join(" · ")}
          </dd>
        </div>
      </dl>

      {status.lastCheck ? (
        <p className="text-xs text-muted-foreground">
          {t("lastCheck", {
            time: format.dateTime(new Date(status.lastCheck), DATE_FORMAT),
          })}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Renders a plain section, not a PageSection: the home page already wraps
 * every section in one PageSection (src/app/[lang]/page.tsx), so opening a
 * second one here would double the vertical rhythm and horizontal padding.
 */
export async function Systems() {
  const t = await getTranslations("systems");

  return (
    <div className="space-y-8">
      <PageHeader
        as="h2"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <Suspense fallback={<SystemsNotice label={t("unavailable")} />}>
        <SystemsPanel />
      </Suspense>
    </div>
  );
}
