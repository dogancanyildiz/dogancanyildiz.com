import { getFormatter, getTranslations } from "next-intl/server";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { cn } from "@/lib/utils";
import { getLiveStatus, type LiveStatusState } from "@/lib/status-page";

/**
 * The "live status" cell of the Systems panel.
 *
 * Server component on purpose, and the reason the CSP is untouched by this
 * feature: the Uptime Kuma JSON is read during the render on the server, so the
 * browser makes no request to the monitoring host and no connect-src entry is
 * needed. The monitoring origin never reaches the client bundle either.
 *
 * Kuma's `msg` field (an operator written failure string) is never rendered.
 * It is dropped at the parse boundary in src/lib/status-page.ts, so no third
 * party prose can reach this markup.
 *
 * With no snapshot the cell falls back to the plain status page link, which is
 * exactly what it printed before the widget existed.
 */

/** Heartbeats kept at 320px. The rest are revealed from the sm breakpoint. */
const MOBILE_BEAT_LIMIT = 24;

const STATE_LABEL_KEY = {
  up: "liveUp",
  down: "liveDown",
  pending: "livePending",
  maintenance: "liveMaintenance",
  unknown: "liveUnknown",
} as const satisfies Record<LiveStatusState, string>;

/**
 * Theme tokens only, no literal colours: each of these resolves through
 * globals.css and carries a separate light and dark value.
 */
const STATE_COLOR = {
  up: "bg-status-up",
  down: "bg-status-down",
  pending: "bg-status-pending",
  maintenance: "bg-status-maintenance",
  unknown: "bg-border-strong",
} as const satisfies Record<LiveStatusState, string>;

/** Compact, explicit about the zone: the instants come from Kuma in UTC. */
const BEAT_TIME_FORMAT = {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
} as const;

const UPTIME_FORMAT = {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
} as const;

export async function LiveStatus({ href }: { href: string }) {
  const [t, tA11y, format, snapshot] = await Promise.all([
    getTranslations("systems"),
    getTranslations("a11y"),
    getFormatter(),
    getLiveStatus(),
  ]);

  const statusLink = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-border-strong underline-offset-4 transition-colors hover:text-primary"
    >
      {t("statusPage")}
      <span aria-hidden="true"> ↗</span>
      <NewTabHint text={tA11y("opensInNewTab")} />
    </a>
  );

  if (!snapshot) {
    return statusLink;
  }

  const label = t(STATE_LABEL_KEY[snapshot.status]);
  const hiddenBeats = Math.max(0, snapshot.beats.length - MOBILE_BEAT_LIMIT);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              STATE_COLOR[snapshot.status],
              // Only a healthy monitor breathes, the same way the hero
              // availability dot does; the reduced-motion block in globals.css
              // stops it there and here alike.
              snapshot.status === "up" && "status-pulse"
            )}
          />
          {label}
        </span>
        {snapshot.uptime24 === null ? null : (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {format.number(snapshot.uptime24, UPTIME_FORMAT)}
            <span className="ml-1 font-sans">{t("liveUptimeWindow")}</span>
          </span>
        )}
      </div>

      <div className="flex items-end gap-[2px] overflow-hidden">
        {snapshot.beats.map((beat, index) => {
          const time = format.dateTime(new Date(beat.time), BEAT_TIME_FORMAT);
          const beatLabel = t(STATE_LABEL_KEY[beat.status]);
          const description =
            beat.ping === null
              ? `${time} · ${beatLabel}`
              : `${time} · ${beatLabel} · ${t("livePing", { ping: beat.ping })}`;
          return (
            <span
              key={`${beat.time}-${index}`}
              role="img"
              title={description}
              aria-label={description}
              className={cn(
                "h-3 w-[3px] shrink-0 rounded-[1px] sm:h-4",
                STATE_COLOR[beat.status],
                index < hiddenBeats && "hidden sm:block"
              )}
            />
          );
        })}
      </div>

      <p className="text-xs font-normal text-muted-foreground">
        {t("liveChecks", { count: snapshot.beats.length })}
      </p>

      {statusLink}
    </div>
  );
}
