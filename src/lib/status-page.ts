import "server-only";
import { z } from "zod";
import { describeError, log } from "@/lib/log";

/**
 * Reads the public Uptime Kuma status page API on the server.
 *
 * Kuma exposes two unauthenticated JSON endpoints behind every public status
 * page. They carry no CORS header, so they can only be read server side, which
 * is also where they belong: the browser never learns the monitoring origin,
 * the site's CSP stays unchanged, and the response never reaches the client
 * bundle. The home page keeps its static prerender; `next: { revalidate }`
 * turns it into an ISR page whose HTML is regenerated at most once a minute.
 *
 * Every failure path returns null on purpose. The panel falls back to the plain
 * status page link, and `next build` must never fail because a monitoring
 * container was restarting: the fetch is wrapped, the error is logged as a
 * warning and the page is produced without live data.
 */

export const STATUS_REVALIDATE_SECONDS = 60;
export const STATUS_FETCH_TIMEOUT_MS = 4000;

/** Newest heartbeats kept for the strip. Kuma returns roughly 100. */
export const STATUS_BEAT_LIMIT = 40;

/**
 * Preferred monitor when a status page publishes several. The panel reports on
 * this site, not on every service the same Kuma instance happens to watch.
 */
const PREFERRED_MONITOR_NAME = "dogancanyildiz.com";

export type LiveStatusState =
  "up" | "down" | "pending" | "maintenance" | "unknown";

export interface StatusBeat {
  status: LiveStatusState;
  /** ISO 8601 instant, always UTC. */
  time: string;
  /** Round trip in milliseconds, null when Kuma recorded none. */
  ping: number | null;
}

export interface LiveStatusSnapshot {
  status: LiveStatusState;
  /** 0..1, null when Kuma published no 24 hour figure for the monitor. */
  uptime24: number | null;
  beats: StatusBeat[];
  monitorName: string;
  /** ISO 8601 instant of the newest heartbeat. */
  checkedAt: string;
}

export interface StatusPageTarget {
  origin: string;
  slug: string;
  /** The public page itself, the value the panel links to. */
  href: string;
}

/**
 * Kuma's own status codes. Anything outside the set is treated as unknown
 * rather than guessed at, so a new code in a future release renders grey
 * instead of claiming the site is up.
 */
const BEAT_STATE: Record<number, LiveStatusState> = {
  0: "down",
  1: "up",
  2: "pending",
  3: "maintenance",
};

const monitorSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

const statusPageSchema = z.object({
  publicGroupList: z.array(
    z.object({
      monitorList: z.array(monitorSchema),
    })
  ),
});

/**
 * `msg` is deliberately absent from this schema. It is operator supplied text
 * from a third party system and the panel never renders it, so it is dropped
 * at the boundary instead of being carried around and trusted later.
 */
const beatSchema = z.object({
  status: z.number(),
  time: z.string(),
  ping: z.number().nullish(),
});

const heartbeatSchema = z.object({
  heartbeatList: z.record(z.string(), z.array(beatSchema)),
  uptimeList: z.record(z.string(), z.number()).optional(),
});

/**
 * Splits NEXT_PUBLIC_STATUS_URL into the API origin and the status page slug.
 *
 * Only an https `/status/<slug>` URL is accepted, the shape Kuma publishes.
 * Anything else disables the widget and leaves the panel with the link alone:
 * a guessed slug would hit an unrelated endpoint on someone else's host.
 */
export function parseStatusPageUrl(
  raw: string | undefined | null
): StatusPageTarget | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0] !== "status") return null;

  const slug = segments[1];
  if (!slug || !/^[A-Za-z0-9._~-]+$/.test(slug)) return null;

  return { origin: url.origin, slug, href: url.href };
}

/** Kuma sends "2026-09-03 09:33:57.494", a UTC instant without a zone. */
export function parseBeatTime(value: string): string | null {
  const match = value
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?Z?$/);
  if (!match) return null;
  const parsed = new Date(`${match[1]}T${match[2]}${match[3] ?? ""}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function toBeatState(status: number): LiveStatusState {
  return BEAT_STATE[status] ?? "unknown";
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(STATUS_FETCH_TIMEOUT_MS),
    next: { revalidate: STATUS_REVALIDATE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Pure assembly step, separated from the network so the mapping rules can be
 * asserted without a fetch mock.
 */
export function buildSnapshot(
  statusPage: unknown,
  heartbeat: unknown
): LiveStatusSnapshot | null {
  const page = statusPageSchema.safeParse(statusPage);
  const beats = heartbeatSchema.safeParse(heartbeat);
  if (!page.success || !beats.success) return null;

  const monitors = page.data.publicGroupList.flatMap(
    (group) => group.monitorList
  );
  if (monitors.length === 0) return null;

  const monitor =
    monitors.find((entry) => entry.name === PREFERRED_MONITOR_NAME) ??
    monitors[0];
  if (!monitor) return null;

  const key = String(monitor.id);
  const raw = beats.data.heartbeatList[key];
  if (!raw || raw.length === 0) return null;

  const mapped: StatusBeat[] = [];
  for (const beat of raw) {
    const time = parseBeatTime(beat.time);
    if (!time) continue;
    mapped.push({
      status: toBeatState(beat.status),
      time,
      ping: typeof beat.ping === "number" ? Math.round(beat.ping) : null,
    });
  }
  if (mapped.length === 0) return null;

  const recent = mapped.slice(-STATUS_BEAT_LIMIT);
  const last = recent[recent.length - 1];
  if (!last) return null;

  const uptimeRaw = beats.data.uptimeList?.[`${key}_24`];
  const uptime24 =
    typeof uptimeRaw === "number" && Number.isFinite(uptimeRaw)
      ? Math.min(1, Math.max(0, uptimeRaw))
      : null;

  return {
    status: last.status,
    uptime24,
    beats: recent,
    monitorName: monitor.name,
    checkedAt: last.time,
  };
}

/**
 * Reads both endpoints for the configured status page. Returns null whenever
 * the URL is not a Kuma status page, the host is unreachable, the request
 * exceeds the timeout or either payload fails validation.
 */
export async function getLiveStatus(
  target: StatusPageTarget | null = parseStatusPageUrl(
    process.env.NEXT_PUBLIC_STATUS_URL
  )
): Promise<LiveStatusSnapshot | null> {
  if (!target) return null;

  try {
    const [statusPage, heartbeat] = await Promise.all([
      fetchJson(`${target.origin}/api/status-page/${target.slug}`),
      fetchJson(`${target.origin}/api/status-page/heartbeat/${target.slug}`),
    ]);
    const snapshot = buildSnapshot(statusPage, heartbeat);
    if (!snapshot) {
      log("warn", "status page payload rejected", { slug: target.slug });
    }
    return snapshot;
  } catch (error) {
    log("warn", "status page fetch failed", {
      slug: target.slug,
      error: describeError(error),
    });
    return null;
  }
}
