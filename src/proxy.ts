import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match every pathname except:
  // - /api (Route Handlers keep their own locale handling)
  // - /_next and /_vercel (framework internals)
  // - anything containing a dot (favicon.ico, robots.txt, sitemap.xml, static files)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
