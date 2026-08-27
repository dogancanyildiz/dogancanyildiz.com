export const navItems = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/projects", key: "nav.projects" },
  { href: "/blog", key: "nav.blog" },
  { href: "/contact", key: "nav.contact" },
] as const;

export type NavItem = (typeof navItems)[number];
