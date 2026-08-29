import "server-only";
import { z } from "zod";

import { log, type LogFields } from "@/lib/log";

/**
 * Gatus endpoint key, derived by Gatus as "<group>_<name>".
 * Must stay in sync with infra/gatus/config/gatus.yaml.
 */
export const SITE_ENDPOINT_KEY = "public_site";

/**
 * Public alias shown to visitors. Never derived from the Gatus payload, so a
 * config change on the monitoring side can never rename it into a hostname.
 */
export const SITE_ENDPOINT_ALIAS = "site";

const REVALIDATE_SECONDS = 60;
const FETCH_TIMEOUT_MS = 3000;

const gatusResultSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
});

const gatusEndpointStatusSchema = z.object({
  key: z.string(),
  uptime: z.record(z.string(), z.number()).optional(),
  results: z.array(gatusResultSchema).default([]),
});

const gatusStatusesSchema = z.object({
  results: z.array(gatusEndpointStatusSchema).default([]),
});

const gatusUptimePayloadSchema = z.union([
  z.number(),
  z.object({ uptime: z.number() }).transform((value) => value.uptime),
]);

/**
 * The only shape that ever reaches a client component.
 * Adding a field here is a security decision, see docs/09-guvenlik.md section 3:
 * hostname, port, internal address, IP and the Gatus URL are never allowed.
 */
export interface SiteStatus {
  name: string;
  up: boolean;
  uptime24h: number | null;
  lastCheck: string | null;
}

function apiUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path}`;
}

/**
 * Masks a URL down to a hostname fragment safe for logs: enough to tell
 * entries apart across environments, never enough to reconstruct GATUS_URL.
 */
function maskHost(rawUrl: string): string {
  let host: string;
  try {
    host = new URL(rawUrl).hostname;
  } catch {
    return "invalid";
  }
  if (host.length <= 4) return "*".repeat(host.length);
  return `${host.slice(0, 2)}***${host.slice(-2)}`;
}

function isValidTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

/**
 * Stringifies a caught error for logging with the GATUS_URL host scrubbed
 * out. Some fetch failures (DNS errors, custom fetch wrappers) embed the
 * full request URL in their message, which would defeat maskHost() if the
 * message were logged verbatim.
 */
function safeErrorMessage(error: unknown, base: string): string {
  const raw = String(error);
  let host: string;
  try {
    host = new URL(base).hostname;
  } catch {
    return raw;
  }
  return host ? raw.split(host).join(maskHost(base)) : raw;
}

/**
 * Single-line, secret-free warning so misconfiguration leaves a trace.
 *
 * It goes through log() rather than console.warn with a hand built object:
 * src/lib/log.ts documents the line shape as the whole observability contract,
 * and a line without time, level and msg is dropped by any Coolify filter that
 * selects on level or sorts on time.
 */
function logStatusIssue(
  base: string | undefined,
  reason: string,
  extra?: LogFields
): void {
  log("warn", "site status unavailable", {
    scope: "status",
    reason,
    gatusHost: base ? maskHost(base) : "unset",
    ...extra,
  });
}

/**
 * Gatus reports uptime as a 0..1 ratio in some builds and as a 0..100
 * percentage in others. Normalise both to a percentage with two decimals.
 */
function toPercent(raw: number): number | null {
  if (!Number.isFinite(raw) || raw < 0) return null;
  const percent = raw <= 1 ? raw * 100 : raw;
  if (percent > 100) return null;
  return Math.round(percent * 100) / 100;
}

function parseUptimePayload(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  let candidate: unknown;
  try {
    candidate = JSON.parse(trimmed);
  } catch {
    const numeric = Number(trimmed);
    return Number.isNaN(numeric) ? null : toPercent(numeric);
  }

  const parsed = gatusUptimePayloadSchema.safeParse(candidate);
  return parsed.success ? toPercent(parsed.data) : null;
}

/**
 * Reads the public site status from Gatus.
 *
 * Server-only: GATUS_URL is a Coolify runtime variable and must never be
 * bundled into client code. Returns null on any failure so the caller can fall
 * back to a neutral "status unavailable" message instead of throwing.
 */
export async function getSiteStatus(): Promise<SiteStatus | null> {
  const base = process.env.GATUS_URL;
  if (!base) {
    logStatusIssue(base, "gatus-url-unset");
    return null;
  }

  try {
    const [statusesOutcome, uptimeOutcome] = await Promise.allSettled([
      fetch(apiUrl(base, "/api/v1/endpoints/statuses?page=1&pageSize=20"), {
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }),
      fetch(
        apiUrl(base, `/api/v1/endpoints/${SITE_ENDPOINT_KEY}/uptimes/24h`),
        {
          next: { revalidate: REVALIDATE_SECONDS },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        }
      ),
    ]);

    // The statuses request carries up/down and lastCheck: without it there is
    // nothing to render, so its failure still aborts the whole panel.
    if (statusesOutcome.status === "rejected") {
      logStatusIssue(base, "statuses-fetch-failed", {
        message: safeErrorMessage(statusesOutcome.reason, base),
      });
      return null;
    }
    const statusesResponse = statusesOutcome.value;
    if (!statusesResponse.ok) {
      logStatusIssue(base, "statuses-http-error", {
        status: statusesResponse.status,
      });
      return null;
    }

    const parsed = gatusStatusesSchema.safeParse(await statusesResponse.json());
    if (!parsed.success) {
      logStatusIssue(base, "statuses-schema-mismatch");
      return null;
    }

    const endpoint = parsed.data.results.find(
      (entry) => entry.key === SITE_ENDPOINT_KEY
    );
    if (!endpoint) {
      logStatusIssue(base, "endpoint-not-found", { key: SITE_ENDPOINT_KEY });
      return null;
    }

    const lastResult = endpoint.results.at(-1);
    if (!lastResult) {
      logStatusIssue(base, "no-results");
      return null;
    }

    // The 24h uptime request is best-effort: a timeout or network error here
    // must not take the whole panel down, only its uptime figure.
    let uptime24h: number | null = null;
    if (uptimeOutcome.status === "fulfilled" && uptimeOutcome.value.ok) {
      uptime24h = parseUptimePayload(await uptimeOutcome.value.text());
    } else if (uptimeOutcome.status === "rejected") {
      logStatusIssue(base, "uptime-fetch-failed", {
        message: safeErrorMessage(uptimeOutcome.reason, base),
      });
    } else if (uptimeOutcome.status === "fulfilled") {
      logStatusIssue(base, "uptime-http-error", {
        status: uptimeOutcome.value.status,
      });
    }
    if (uptime24h === null && endpoint.uptime?.["24h"] !== undefined) {
      uptime24h = toPercent(endpoint.uptime["24h"]);
    }

    if (!isValidTimestamp(lastResult.timestamp)) {
      logStatusIssue(base, "invalid-timestamp");
    }

    return {
      name: SITE_ENDPOINT_ALIAS,
      up: lastResult.success,
      uptime24h,
      lastCheck: isValidTimestamp(lastResult.timestamp)
        ? lastResult.timestamp
        : null,
    };
  } catch (error) {
    logStatusIssue(base, "unexpected-error", {
      message: safeErrorMessage(error, base),
    });
    return null;
  }
}
