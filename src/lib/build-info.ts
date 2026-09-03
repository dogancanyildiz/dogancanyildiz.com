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

/** A git object name: 7 to 40 lowercase hex characters, nothing else. */
const SHA_PATTERN = /^[0-9a-f]{7,40}$/;

/**
 * Commit SHA of the running deploy.
 *
 * NEXT_PUBLIC_BUILD_SHA wins whenever it is set: CI passes `github.sha` and
 * the Dockerfile turns the build arg into an env var, so that is the value a
 * reproducible build carries. Coolify turned out not to pass SOURCE_COMMIT as
 * a *build* arg, only as a runtime variable inside the container, which left
 * the panel's commit cell empty on every Coolify deploy; the runtime variable
 * is read here instead of leaving it unused.
 *
 * SOURCE_COMMIT is not a NEXT_PUBLIC_ value and is deliberately not turned
 * into one: both consumers (footer.tsx, systems.tsx) are server components, so
 * this module never evaluates in the browser and the value cannot cause a
 * hydration mismatch.
 *
 * Expect a delay on a fresh deploy: `next build` runs in a builder that has no
 * SOURCE_COMMIT, so the prerendered HTML still reads "no data". The home page
 * revalidates every 60s once the live status widget is configured
 * (src/lib/status-page.ts), and the first regeneration inside the running
 * container fills the cell in.
 *
 * The value is kept whole. formatBuildSha() is the single place that shortens
 * it to seven characters for display.
 */
export function resolveBuildSha(
  publicSha: string | undefined,
  sourceCommit: string | undefined
): string {
  const explicit = publicSha?.trim() ?? "";
  if (explicit) return explicit;

  const runtime = sourceCommit?.trim().toLowerCase() ?? "";
  return SHA_PATTERN.test(runtime) ? runtime : "";
}

const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE?.trim() ?? "";

/**
 * Build metadata surfaced in the footer and the Systems panel. The date comes
 * from a NEXT_PUBLIC_ variable, inlined by `next build` rather than read off
 * disk, so nothing here pulls node:fs in. The sha adds a runtime fallback, see
 * resolveBuildSha above.
 */
export const buildInfo = {
  sha: resolveBuildSha(
    process.env.NEXT_PUBLIC_BUILD_SHA,
    process.env.SOURCE_COMMIT
  ),
  date: buildDate,
  year: resolveBuildYear(buildDate),
} as const;

export function formatBuildSha(sha: string): string {
  return sha.length >= 7 ? sha.slice(0, 7) : sha;
}
