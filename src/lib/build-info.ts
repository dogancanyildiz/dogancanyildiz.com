function resolveBuildYear(buildDate: string): string {
  const fromBuildDate = buildDate.slice(0, 4);
  if (/^\d{4}$/.test(fromBuildDate)) return fromBuildDate;

  // No NEXT_PUBLIC_BUILD_DATE (local dev, or a build that skipped the CI arg
  // / Coolify Build Variable): return an empty year instead of computing one.
  // `new Date().getFullYear()` here would not be a build-time constant, it
  // would be "the year wherever this module happens to run". Both consumers
  // are server components today (footer.tsx, systems.tsx), so that is the
  // build machine's clock for a prerendered page and the request clock for a
  // dynamic one; move either behind a "use client" boundary and it becomes
  // the visitor's clock during hydration, which is a mismatch against the
  // prerendered HTML from the first new year onward. The value the footer
  // prints has to come from the build or not at all.
  // Footer.tsx renders the copyright line without a year when this is "".
  return "";
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
