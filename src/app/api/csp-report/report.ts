import { createRateLimiter } from "@/lib/rate-limit";

import { CSP_REPORT_LIMITS, isCspMeasurementEnabled } from "./mode";

/**
 * Parsing and throttling for the CSP violation collector.
 *
 * It lives next to route.ts rather than inside it because a route module may
 * only export the request handlers and the segment config; every helper the
 * tests reach for has to sit in a plain module.
 */

/** A report is a few hundred bytes, reports+json batches a handful of them. */
export const MAX_REPORT_BYTES = 64 * 1024;

const ACCEPTED_CONTENT_TYPES = [
  // Deprecated report-uri format, still what Firefox and Safari send.
  "application/csp-report",
  // Reporting API format used by report-to.
  "application/reports+json",
];

/**
 * The idle budget is deliberately small: with the report-only policy switched
 * off only a genuine break in the enforced policy reports, and a flood is then
 * either an attack or a bug. While CSP_REPORT_ONLY=1 measures the strict
 * policy, every page view legitimately produces around twenty reports, so the
 * budget follows the same switch instead of throttling the measurement away.
 */
export const CSP_REPORT_RATE_LIMIT = {
  limit: isCspMeasurementEnabled()
    ? CSP_REPORT_LIMITS.measuring
    : CSP_REPORT_LIMITS.idle,
  windowMs: 60_000,
} as const;

// next dev re-evaluates modules on hot reload, a global handle keeps a single
// limiter alive across those reloads so the dev behaviour matches production.
const globalForCspReports = globalThis as unknown as {
  cspReportRateLimiter?: ReturnType<typeof createRateLimiter>;
};

export const cspReportRateLimiter =
  globalForCspReports.cspReportRateLimiter ??
  createRateLimiter({
    limit: CSP_REPORT_RATE_LIMIT.limit,
    windowMs: CSP_REPORT_RATE_LIMIT.windowMs,
  });

if (process.env.NODE_ENV !== "production") {
  globalForCspReports.cspReportRateLimiter = cspReportRateLimiter;
}

export type NormalizedReport = {
  documentUrl: string;
  directive: string;
  blockedUrl: string;
  disposition: string;
  sourceFile: string;
  lineNumber: number | null;
};

/** Keeps a forged report from writing an unbounded string into the log. */
function field(value: unknown, max = 300): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function lineNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** report-uri shape: { "csp-report": { "violated-directive": ... } }. */
function fromCspReport(body: unknown): NormalizedReport | null {
  const outer = record(body);
  const report = outer ? record(outer["csp-report"]) : null;
  if (!report) {
    return null;
  }
  return {
    documentUrl: field(report["document-uri"]),
    directive: field(
      report["effective-directive"] ?? report["violated-directive"],
      100
    ),
    blockedUrl: field(report["blocked-uri"]),
    disposition: field(report["disposition"], 20) || "enforce",
    sourceFile: field(report["source-file"]),
    lineNumber: lineNumber(report["line-number"]),
  };
}

/** Reporting API shape: an array of { type, body } envelopes. */
function fromReportsJson(body: unknown): NormalizedReport[] {
  if (!Array.isArray(body)) {
    return [];
  }
  const reports: NormalizedReport[] = [];
  for (const entry of body) {
    const envelope = record(entry);
    if (!envelope || envelope.type !== "csp-violation") {
      continue;
    }
    const inner = record(envelope.body);
    if (!inner) {
      continue;
    }
    reports.push({
      documentUrl: field(inner.documentURL ?? envelope.url),
      directive: field(inner.effectiveDirective, 100),
      blockedUrl: field(inner.blockedURL),
      disposition: field(inner.disposition, 20) || "enforce",
      sourceFile: field(inner.sourceFile),
      lineNumber: lineNumber(inner.lineNumber),
    });
  }
  return reports;
}

/** Reduces either wire format to the fields that are safe to log. */
export function normalizeReports(body: unknown): NormalizedReport[] {
  const single = fromCspReport(body);
  if (single) {
    return [single];
  }
  return fromReportsJson(body);
}

export function isAcceptedContentType(header: string | null): boolean {
  const type = (header ?? "").split(";")[0].trim().toLowerCase();
  return ACCEPTED_CONTENT_TYPES.includes(type);
}
