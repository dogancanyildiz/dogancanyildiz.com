import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { legacyRedirectTarget } from "@/i18n/legacy-paths";
import { routing } from "@/i18n/routing";
import { isLocalizedRoutePath } from "@/lib/locale-from-pathname";

const handleI18n = createMiddleware(routing);

/**
 * Writes x-pathname on every request and hands the localized ones to next-intl.
 *
 * The matcher covers all paths on purpose. src/app/global-not-found.tsx reads
 * x-pathname to pick the 404 language, and a matcher that skipped some paths
 * left the client free to send that header itself on exactly the paths the
 * proxy did not cover. Setting it here first, for every request, means the
 * value the app reads is always server written.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const permanentTarget = legacyRedirectTarget(pathname);
  if (permanentTarget) {
    // Permanent: these URLs used to be the public pages. 308 keeps the
    // method; Google treats it as a ranking-passing move the same way as 301.
    //
    // A plain URL, not nextUrl.clone(): NextURL records the trailing slash of
    // the incoming path and re-applies it when it formats the pathname, so
    // assigning "/en/about" to a clone of "/about/" still emits
    // "/en/about/", which is a second redirect the site does not serve.
    const url = new URL(request.url);
    url.pathname = permanentTarget;
    return NextResponse.redirect(url, 308);
  }

  if (!isLocalizedRoutePath(pathname)) {
    // Route handlers, framework internals and static files: no locale to
    // negotiate, only the header to forward.
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const patched = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
  });
  return handleI18n(patched);
}

export const config = {
  // Everything. The exclusions live in isLocalizedRoutePath so that the paths
  // the i18n middleware skips still pass through this function.
  matcher: ["/:path*"],
};
