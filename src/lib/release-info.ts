import "server-only";
import { z } from "zod";
import { REPOSITORY_URL } from "@/lib/build-info";
import { describeError, log } from "@/lib/log";

/**
 * The latest published GitHub Release of the site.
 *
 * package.json cannot answer "which version is live": the release workflow
 * tags main after the deploy has already been built, and the version bump
 * reaches main only with the next promotion, so the bundled version is always
 * one release behind. The Releases API knows the tag the moment it is cut.
 *
 * Read on the server with a five minute cache (`next.revalidate`), well
 * inside GitHub's unauthenticated limit of 60 requests an hour per address;
 * the browser never calls GitHub, so the CSP is untouched. Any failure
 * returns null and the panel falls back to the bundled version.
 */
const RELEASE_REVALIDATE_SECONDS = 300;
const RELEASE_FETCH_TIMEOUT_MS = 4000;

export const RELEASES_URL = `${REPOSITORY_URL}/releases`;

const API_URL =
  "https://api.github.com/repos/dogancanyildiz/dogancanyildiz.com/releases/latest";

const releaseSchema = z.object({
  tag_name: z.string().regex(/^v\d+\.\d+\.\d+$/),
  html_url: z.string().url(),
});

export type LatestRelease = {
  /** Without the leading "v": "0.8.0". */
  version: string;
  url: string;
};

export function parseLatestRelease(payload: unknown): LatestRelease | null {
  const parsed = releaseSchema.safeParse(payload);
  if (!parsed.success) return null;
  return {
    version: parsed.data.tag_name.slice(1),
    url: parsed.data.html_url,
  };
}

export async function getLatestRelease(): Promise<LatestRelease | null> {
  try {
    const response = await fetch(API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(RELEASE_FETCH_TIMEOUT_MS),
      next: { revalidate: RELEASE_REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return parseLatestRelease(await response.json());
  } catch (error) {
    log("warn", "latest release fetch failed", {
      error: describeError(error),
    });
    return null;
  }
}
