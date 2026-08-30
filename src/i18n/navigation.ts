import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

// Route params are locale independent, but every layout component imports its
// navigation hooks from this module only (tests/i18n/app-shell.test.ts locks
// that), so the params hook goes through the same single door.
export { useParams } from "next/navigation";

export type AppHref = Parameters<typeof getPathname>[0]["href"];

/**
 * getPathname for a string that may be a concrete slug (`/blog/foo`) or an
 * internal pathname (`/about`). The generated AppHref union only lists the
 * static keys, so callers with a runtime path have to go through here.
 */
export function pathnameForLocale(locale: string, href: string): string {
  return getPathname({
    locale,
    href: href as AppHref,
  });
}

/**
 * With a `pathnames` map, next-intl's usePathname() returns the matched
 * template (`/blog/[slug]`), not the concrete path the visitor is on. Any
 * consumer that compares against content paths or builds a link from the
 * current location has to fill the template with the route params first,
 * otherwise the literal `[slug]` leaks into an href (the 2026-08-31 review
 * caught exactly that on every detail page's language switcher).
 */
export function fillPathname(
  template: string,
  params: Record<string, string | string[] | undefined>
): string {
  return template.replace(/\[(?:\.\.\.)?([^\]]+)\]/g, (match, name) => {
    const value = params[name];
    if (value === undefined) return match;
    return Array.isArray(value) ? value.join("/") : value;
  });
}
