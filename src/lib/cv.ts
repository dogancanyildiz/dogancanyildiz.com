import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";

export { CV_PATH } from "@/lib/site";

/**
 * Server side only, evaluated at build time during static prerender. Returns
 * false until the CV PDF is delivered to public/cv, so the download button
 * never renders as a broken link.
 */
export function hasCv(): boolean {
  return existsSync(
    join(process.cwd(), "public", "cv", "dogancanyildiz-cv.pdf")
  );
}
