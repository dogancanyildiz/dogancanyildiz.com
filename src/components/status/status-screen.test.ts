import { describe, expect, it } from "vitest";
import { statusLinksFor } from "./status-screen";

describe("statusLinksFor", () => {
  const labels = {
    home: "Home",
    projects: "Projects",
    blog: "Blog",
    contact: "Contact",
  };

  it("prefixes English hrefs", () => {
    expect(statusLinksFor("en", labels)).toEqual([
      { href: "/en", label: "Home", primary: true },
      { href: "/en/projects", label: "Projects" },
      { href: "/en/blog", label: "Blog" },
      { href: "/en/contact", label: "Contact" },
    ]);
  });

  it("keeps Turkish hrefs unprefixed and localized", () => {
    expect(statusLinksFor("tr", labels)).toEqual([
      { href: "/", label: "Home", primary: true },
      { href: "/projeler", label: "Projects" },
      { href: "/yazilar", label: "Blog" },
      { href: "/iletisim", label: "Contact" },
    ]);
  });
});
