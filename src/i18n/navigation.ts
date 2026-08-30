import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

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
