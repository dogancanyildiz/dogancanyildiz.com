import { describe, expect, it } from "vitest";
import { statusLinksFor } from "./status-screen";

describe("statusLinksFor", () => {
  const labels = {
    home: "Home",
    projects: "Projects",
    blog: "Blog",
    contact: "Contact",
  };

  it("keeps English hrefs unprefixed", () => {
    expect(statusLinksFor("en", labels)).toEqual([
      { href: "/", label: "Home", primary: true },
      { href: "/projects", label: "Projects" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ]);
  });

  it("prefixes Turkish hrefs so a TR status page never lands on English", () => {
    expect(statusLinksFor("tr", labels)).toEqual([
      { href: "/tr", label: "Home", primary: true },
      { href: "/tr/projects", label: "Projects" },
      { href: "/tr/blog", label: "Blog" },
      { href: "/tr/contact", label: "Contact" },
    ]);
  });
});
