function resolveBuildYear(buildDate: string): string {
  const fromBuildDate = buildDate.slice(0, 4);
  if (/^\d{4}$/.test(fromBuildDate)) return fromBuildDate;

  // No NEXT_PUBLIC_BUILD_DATE (local dev, or a build that skipped the CI arg
  // / Coolify Build Variable): return an empty year instead of computing one.
  // This module ships in the client bundle (imported by the "use client"
  // footer), so `new Date().getFullYear()` here is NOT a build-time constant:
  // it would run again during hydration, in the visitor's browser, at
  // whatever moment they load the page. Right after a build that is usually
  // the same year as the prerendered HTML, but the static pages stay served
  // as-is until the next deploy, so any visit after the calendar year turns
  // over reintroduces the exact hydration mismatch this was meant to avoid.
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
