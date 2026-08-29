import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
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
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  if (!isLocalizedRoutePath(request.nextUrl.pathname)) {
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
