import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isProduction = process.env.NODE_ENV === "production";

// script-src keeps 'unsafe-inline' on purpose. The App Router streams its RSC
// payload through inline script tags, and the nonce based alternative forces
// every route into dynamic rendering. Today the root layout still reads
// cookies, so every page is dynamic anyway, but phase 2 removes that and
// requires that only /api/* stays dynamic; a nonce would block that goal.
// 'unsafe-eval' and ws: are development only, they are needed by React
// Refresh and the HMR socket.
const scriptSrc = isProduction
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const connectSrc = isProduction
  ? "connect-src 'self'"
  : "connect-src 'self' ws:";

const contentSecurityPolicy = [
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

// HSTS is deliberately absent here, it is owned by Traefik so there is a
// single source of truth for it.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
