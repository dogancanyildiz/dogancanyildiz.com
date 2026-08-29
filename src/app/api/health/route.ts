import { NextResponse } from "next/server";
import { posts, projects } from "#site/content";

import { missingMailEnv } from "@/lib/resend";
import { methodNotAllowed } from "@/lib/api-methods";

// Never prerendered, never cached: a cached 200 would keep reporting healthy
// after the process stopped answering.
export const dynamic = "force-dynamic";

/**
 * Public health signal.
 *
 * The body carries only booleans and the aggregate status. Process details
 * such as uptime, pid or memory used to be here; they say nothing about
 * whether the site works and they hand a passer by a free restart timeline,
 * so they are gone.
 *
 * The two checks are not the same kind of signal, and the difference matters
 * to whoever reads an alert:
 *
 * - `mail` is a runtime probe. The variables are read on every request, so it
 *   flips the moment the container is restarted without them. It is the only
 *   thing that can move `status` to "degraded" on a running deployment.
 * - `content` is a build integrity assertion. The collections are imported
 *   from #site/content, so after next build it is a constant baked into the
 *   bundle: a false here means a container was built with an empty content
 *   layer, never that content stopped working at runtime.
 *
 * The HTTP status stays 200 even when a check fails. The Docker healthcheck
 * looks at res.ok and would restart a container that is serving every page
 * correctly but happens to be missing a mail variable; Gatus reads
 * "[BODY].status == ok" and is the one that should raise that alarm.
 */
export async function GET() {
  const checks = {
    content: posts.length > 0 && projects.length > 0,
    mail: missingMailEnv().length === 0,
  };

  const status = Object.values(checks).every(Boolean) ? "ok" : "degraded";

  return NextResponse.json(
    { status, checks, timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Every other verb answers 405 with an Allow header (see @/lib/api-methods).
const rejectMethod = methodNotAllowed("GET, HEAD, OPTIONS");
export {
  rejectMethod as POST,
  rejectMethod as PUT,
  rejectMethod as PATCH,
  rejectMethod as DELETE,
};
