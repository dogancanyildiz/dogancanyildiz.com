import { getClientIp } from "@/lib/client-ip";
import { trustsCloudflareHeaders } from "@/lib/env";
import {
  BodyTooLargeError,
  parseJsonBody,
  readBodyWithLimit,
} from "@/lib/request-body";

import {
  MAX_REPORT_BYTES,
  cspReportRateLimiter,
  isAcceptedContentType,
  normalizeReports,
} from "./report";

/**
 * Collector for the CSP violation reports produced by the policies in
 * next.config.ts (report-uri and report-to both point here).
 *
 * The endpoint is unauthenticated by definition, the browser posts to it
 * without credentials, so the payload is treated as hostile input: an allow
 * list of content types, a hard byte cap, a per IP rate limit and a fixed set
 * of logged fields. Nothing is persisted, each report is written as one JSON
 * line to stdout where the container log driver picks it up.
 *
 * A violation report is not something the visitor can act on, so the response
 * body is always empty: 204 on accept, a status code only on reject.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!isAcceptedContentType(request.headers.get("content-type"))) {
    return new Response(null, { status: 415 });
  }

  // Content-Length is advisory, a chunked body carries none, so this is only a
  // cheap early exit. The real cap is enforced while the body is read.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REPORT_BYTES) {
    return new Response(null, { status: 413 });
  }

  const ip = getClientIp(request.headers, {
    trustCloudflare: trustsCloudflareHeaders(),
  });
  const limit = cspReportRateLimiter.check(ip);
  if (!limit.allowed) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  let rawBody: string;
  try {
    rawBody = await readBodyWithLimit(request, MAX_REPORT_BYTES);
  } catch (error) {
    return new Response(null, {
      status: error instanceof BodyTooLargeError ? 413 : 400,
    });
  }

  const reports = normalizeReports(parseJsonBody(rawBody));
  if (reports.length === 0) {
    return new Response(null, { status: 400 });
  }

  for (const report of reports) {
    console.warn(JSON.stringify({ event: "csp-violation", ...report }));
  }

  return new Response(null, { status: 204 });
}
