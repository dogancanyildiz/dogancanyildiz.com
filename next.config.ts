import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { isCspMeasurementEnabled } from "./src/app/api/csp-report/mode";
import { UMAMI_ORIGIN } from "./src/lib/analytics";

/**
 * Re-exported so the CSP below, src/components/umami-script.tsx and the tests
 * all read one constant and the policy can never drift from the analytics host
 * the tag actually loads.
 */
export { UMAMI_ORIGIN };

/** Route handler that collects CSP violation reports (src/app/api/csp-report). */
export const CSP_REPORT_PATH = "/api/csp-report";

/**
 * Reporting API group name. It has to be identical in the Reporting-Endpoints
 * header and in the report-to directive, otherwise the browser drops reports.
 */
export const CSP_REPORT_GROUP = "csp-endpoint";

/**
 * Absolute report endpoint when the site origin is known at build time.
 *
 * report-uri accepts a relative path, but Reporting-Endpoints is parsed as a
 * URL and browsers differ on how they resolve a relative value, so the
 * absolute form is used whenever NEXT_PUBLIC_SITE_URL is available. Local
 * builds without that variable fall back to the path.
 */
export function cspReportEndpoint(
  siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL
): string {
  const base = siteUrl?.trim().replace(/\/+$/, "") ?? "";
  if (!base) {
    return CSP_REPORT_PATH;
  }
  try {
    return new URL(CSP_REPORT_PATH, base).toString();
  } catch {
    return CSP_REPORT_PATH;
  }
}

type PolicyOptions = {
  /** Report-only builds a stricter policy that is measured, never enforced. */
  reportOnly: boolean;
  isProduction: boolean;
};

/**
 * The enforced policy keeps script-src 'unsafe-inline'.
 *
 * The App Router streams the RSC payload through inline script tags. The only
 * supported alternative is a per request nonce, and a nonce has to be minted in
 * src/proxy.ts, which forces every route out of the static prerender into
 * dynamic rendering. Every page here except /api/* is statically generated and
 * that is the property we keep. 'unsafe-eval' and ws: are development only,
 * React Refresh and the HMR socket need them.
 *
 * The parallel Content-Security-Policy-Report-Only header drops both
 * 'unsafe-inline' values so the real cost of the strict policy can be measured
 * from the reports before anything is enforced. It is off unless the build sets
 * CSP_REPORT_ONLY=1, see src/app/api/csp-report/mode.ts for why the measurement
 * is a bounded window rather than a permanent header.
 */
function buildContentSecurityPolicy({
  reportOnly,
  isProduction,
}: PolicyOptions): string {
  const inlineScript = reportOnly ? "" : " 'unsafe-inline'";
  const scriptSrc = isProduction
    ? `script-src 'self'${inlineScript} ${UMAMI_ORIGIN}`
    : `script-src 'self'${inlineScript} 'unsafe-eval'`;

  // Radix and shadcn components emit runtime inline style attributes.
  const styleSrc = reportOnly
    ? "style-src 'self'"
    : "style-src 'self' 'unsafe-inline'";

  const connectSrc = isProduction
    ? `connect-src 'self' ${UMAMI_ORIGIN}`
    : "connect-src 'self' ws:";

  const endpoint = cspReportEndpoint();

  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    // data: covers the images embedded by the next/og route.
    "img-src 'self' data:",
    "font-src 'self'",
    connectSrc,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // report-to is the current Reporting API directive, report-uri is the
    // deprecated one that Firefox and Safari still rely on. Both point at the
    // same route handler.
    `report-to ${CSP_REPORT_GROUP}`,
    `report-uri ${endpoint}`,
  ].join("; ");
}

/**
 * HSTS lives here on purpose.
 *
 * The Traefik middleware that was supposed to own it is not deployed yet, so
 * without this line no layer sends the header at all. It is kept as a single
 * source of truth: once the edge layer sets HSTS, this entry is removed rather
 * than duplicated. preload is deliberately absent, the apex domain is not ready
 * for a submission that cannot be undone quickly.
 *
 * includeSubDomains has a blast radius beyond the apex: once a browser has seen
 * this header it refuses plain http to every subdomain (dev., preview., send. and
 * send.dogancanyildiz.com for a year, and shortening the max-age only helps the
 * clients that come back afterwards. Every one of those hosts has to terminate
 * TLS with a valid certificate before this ships.
 *
 * Production only: a max-age of a year pinned to https on localhost would make
 * plain http development on the same host impossible.
 */
const HSTS_HEADER = {
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains",
};

function staticSecurityHeaders(isProduction: boolean) {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: [
        "camera=()",
        "microphone=()",
        "geolocation=()",
        "payment=()",
        "usb=()",
        "serial=()",
        "midi=()",
        "display-capture=()",
        "browsing-topics=()",
        "interest-cohort=()",
      ].join(", "),
    },
    // frame-ancestors 'none' already covers modern browsers; XFO is the
    // fallback for the ones that ignore it.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    // Only governs how other origins may embed resources we serve. It does not
    // touch the Umami script, which is loaded from umami.dravcore.com
    // and carries that origin's own CORP. /feed.xml and /api/health stay
    // readable for server side clients (feed readers, uptime probes): CORP is
    // enforced by browsers on subresource loads, cross origin fetch is governed
    // by CORS, which we never granted in the first place.
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    ...(isProduction ? [HSTS_HEADER] : []),
  ];
}

/**
 * Neither /cv nor /fonts/og uses content hashed file names: the CV keeps the
 * same path when the owner ships a new revision and the vendored OG fonts are
 * overwritten in place by scripts/vendor-fonts.mjs. immutable plus a one year
 * max-age would therefore pin a stale file in browser caches with no way to
 * bust it, so both get a one day max-age instead. The Next build output under
 * /_next/static is hashed and already ships immutable from the framework.
 */
const ONE_DAY_CACHE = {
  key: "Cache-Control",
  value: "public, max-age=86400",
};

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    // Lets src/app/global-not-found.tsx handle requests that never reach the
    // [lang] segment. Without it those 404s render with no layout at all: no
    // stylesheet, no html lang attribute.
    globalNotFound: true,
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";

    return [
      {
        source: "/:path*",
        headers: [
          ...staticSecurityHeaders(isProduction),
          {
            key: "Reporting-Endpoints",
            value: `${CSP_REPORT_GROUP}="${cspReportEndpoint()}"`,
          },
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy({
              reportOnly: false,
              isProduction,
            }),
          },
          // Measurement only. Production, and only while CSP_REPORT_ONLY=1
          // opens a measurement window: in development every HMR script would
          // report, and permanently on it costs every visitor around twenty
          // extra POSTs per page view for a result we can read in an hour.
          ...(isProduction && isCspMeasurementEnabled()
            ? [
                {
                  key: "Content-Security-Policy-Report-Only",
                  value: buildContentSecurityPolicy({
                    reportOnly: true,
                    isProduction,
                  }),
                },
              ]
            : []),
        ],
      },
      {
        source: "/cv/:path*",
        headers: [
          ONE_DAY_CACHE,
          // The CV is linked from the site but is not a page we want in the
          // index; robots.txt alone would not stop a listing that comes from an
          // external link.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      { source: "/fonts/:path*", headers: [ONE_DAY_CACHE] },
      { source: "/icon", headers: [ONE_DAY_CACHE] },
      { source: "/apple-icon", headers: [ONE_DAY_CACHE] },
    ];
  },
  async redirects() {
    // The phase 3 icon route replaced the static favicon file, so
    // /favicon.ico 404s unless it is redirected to the single icon source
    // (src/app/icon.tsx). The proxy already skips paths with a dot, and Next
    // evaluates redirects before routing, so this runs regardless.
    return [{ source: "/favicon.ico", destination: "/icon", permanent: true }];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
