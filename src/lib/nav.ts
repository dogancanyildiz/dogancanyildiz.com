export const navItems = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/services", key: "nav.services" },
  { href: "/projects", key: "nav.projects" },
  { href: "/blog", key: "nav.blog" },
  { href: "/contact", key: "nav.contact" },
] as const;

export type NavItem = (typeof navItems)[number];

/**
 * Whether a nav item's href matches the current pathname. The root item only
 * matches the exact root path; every other item also matches its own
 * subpaths (/about matches /about, not /about-me) so a single computation
 * can drive both aria-current and the active styling.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
