function resolveBuildYear(buildDate: string): string {
  const fromBuildDate = buildDate.slice(0, 4);
  if (/^\d{4}$/.test(fromBuildDate)) return fromBuildDate;

  // No NEXT_PUBLIC_BUILD_DATE (local dev, or a build that skipped the CI arg):
  // fall back to the year at build time. This value is inlined into the
  // bundle at build time and never recomputed at request time, so it is the
  // same on the server and in the client and cannot cause a hydration
  // mismatch the way `new Date().getFullYear()` at render time would.
  return String(new Date().getFullYear());
}

const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE?.trim() ?? "";

/**
 * Build-time metadata surfaced in the footer. Values are injected through
 * NEXT_PUBLIC_* env vars so they can be read from client components without
 * pulling node:fs into the browser bundle.
 */
export const buildInfo = {
  sha: process.env.NEXT_PUBLIC_BUILD_SHA?.trim() ?? "",
  date: buildDate,
  year: resolveBuildYear(buildDate),
} as const;

export function formatBuildSha(sha: string): string {
  return sha.length >= 7 ? sha.slice(0, 7) : sha;
}
