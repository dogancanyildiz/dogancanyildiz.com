import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Root path.
    "/",
    // Every locale prefixed path.
    "/(en|tr)/:path*",
    // Has a dot, so the generic pattern below skips it; list it explicitly.
    "/feed.xml",
    // Everything else except /api, /_next, /_vercel, the exact /icon route
    // (app root metadata route, outside the lang segment, no locale prefix
    // to rewrite to) and anything containing a dot (favicon.ico, robots.txt,
    // static files).
    "/((?!api|_next|_vercel|icon$|.*\\..*).*)",
  ],
};
