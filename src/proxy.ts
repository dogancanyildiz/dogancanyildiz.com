import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import {
  LEGACY_EN_PAGE_REDIRECTS,
  unprefixedTurkishPath,
} from "@/i18n/legacy-en-paths";
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

  const legacyEnglish = LEGACY_EN_PAGE_REDIRECTS[pathname];
  const legacyTurkish = unprefixedTurkishPath(pathname);
  const permanentTarget = legacyEnglish ?? legacyTurkish;
  if (permanentTarget && permanentTarget !== pathname) {
    // Permanent: these URLs used to be the public pages. 308 keeps the
    // method; Google treats it as a ranking-passing move the same way as 301.
    const url = request.nextUrl.clone();
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
