import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Single source of truth for the self-hosted Umami origin.
 * Both the CSP below and tests/config/csp.test.ts read this constant, so the
 * policy and the analytics host can never drift apart.
 */
export const UMAMI_ORIGIN = "https://analytics.dogancanyildiz.com";

function buildContentSecurityPolicy(): string {
  const isProduction = process.env.NODE_ENV === "production";

  // script-src keeps 'unsafe-inline' on purpose. The App Router streams its RSC
  // payload through inline script tags, and the nonce based alternative forces
  // every route into dynamic rendering. Today the root layout still reads
  // cookies, so every page is dynamic anyway, but phase 2 removes that and
  // requires that only /api/* stays dynamic; a nonce would block that goal.
  // 'unsafe-eval' and ws: are development only, they are needed by React
  // Refresh and the HMR socket.
  const scriptSrc = isProduction
    ? `script-src 'self' 'unsafe-inline' ${UMAMI_ORIGIN}`
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  const connectSrc = isProduction
    ? `connect-src 'self' ${UMAMI_ORIGIN}`
    : "connect-src 'self' ws:";

  return [
    "default-src 'self'",
    scriptSrc,
    // Radix and shadcn components emit runtime inline style attributes.
    "style-src 'self' 'unsafe-inline'",
    // data: covers the images embedded by the next/og route.
    "img-src 'self' data:",
    "font-src 'self'",
    connectSrc,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

// HSTS is deliberately absent here, it is owned by Traefik so there is a
// single source of truth for it.
const staticSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

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
    return [
      {
        source: "/:path*",
        headers: [
          ...staticSecurityHeaders,
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy(),
          },
        ],
      },
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
