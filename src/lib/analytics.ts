/**
 * Single source of truth for the self-hosted Umami tracker.
 *
 * The origin is a constant rather than an environment variable because the CSP
 * in next.config.ts has to name it literally: the policy is baked into the
 * response headers at build time and cannot follow a runtime value. next.config
 * re-exports UMAMI_ORIGIN from here and src/components/umami-script.tsx checks
 * the configured script URL against it, so a mismatch fails the build instead
 * of shipping a tag the browser blocks.
 */
export const UMAMI_ORIGIN = "https://analytics.dogancanyildiz.com";

export class UmamiOriginMismatchError extends Error {
  constructor(scriptUrl: string) {
    super(
      `UMAMI_SCRIPT_URL points at "${scriptUrl}", but the tracker has to be served from ${UMAMI_ORIGIN} with no path of its own: that is the only origin the Content-Security-Policy allows and /script.js is appended here. Change the build argument or update UMAMI_ORIGIN in src/lib/analytics.ts.`
    );
    this.name = "UmamiOriginMismatchError";
  }
}

export type UmamiTag = {
  src: string;
  websiteId: string;
  /**
   * Umami only records events whose hostname is listed here, so a staging or
   * preview container running the same image cannot write into the production
   * site. Undefined when the site origin is unknown, which only happens in a
   * build that already fails on NEXT_PUBLIC_SITE_URL.
   */
  domains?: string;
};

export type UmamiInput = {
  scriptUrl: string | undefined;
  websiteId: string | undefined;
  siteUrl: string | undefined;
  isProduction: boolean;
};

function hostnameOf(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed).hostname;
  } catch {
    return undefined;
  }
}

/**
 * The variable is a base url and /script.js is appended below, so the only
 * accepted shapes are the bare origin and the full tag url. Writing the tag url
 * is the obvious misreading of a name that ends in SCRIPT_URL and the old check
 * let it through, producing a silent .../script.js/script.js 404. Anything else
 * on the path is a different Umami install, not a shape we can normalise.
 */
function isBareTrackerPath(url: URL): boolean {
  if (url.search || url.hash) {
    return false;
  }
  const path = url.pathname.replace(/\/+$/, "").replace(/\/script\.js$/, "");
  return path === "";
}

/**
 * Returns the tag to render, or null when analytics is not configured.
 *
 * A configured but wrong origin is a deployment mistake, not a missing
 * feature: in a production build it throws so the mistake surfaces at build
 * time, and in development it only logs, so a local experiment against another
 * Umami instance does not block `next dev`.
 */
export function resolveUmamiTag(input: UmamiInput): UmamiTag | null {
  const scriptUrl = input.scriptUrl?.trim();
  const websiteId = input.websiteId?.trim();

  if (!scriptUrl || !websiteId) {
    return null;
  }

  let url: URL | null = null;
  try {
    url = new URL(scriptUrl);
  } catch {
    url = null;
  }

  if (!url || url.origin !== UMAMI_ORIGIN || !isBareTrackerPath(url)) {
    if (input.isProduction) {
      throw new UmamiOriginMismatchError(scriptUrl);
    }
    console.error(new UmamiOriginMismatchError(scriptUrl).message);
    return null;
  }

  return {
    src: `${UMAMI_ORIGIN}/script.js`,
    websiteId,
    domains: hostnameOf(input.siteUrl),
  };
}
