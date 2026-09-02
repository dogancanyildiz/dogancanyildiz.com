import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ value: "/" }));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-pathname": pathname.value }),
}));

// The real loader reads the request locale through next-intl's server context,
// which only exists inside a Next request. Tagging the value with its locale is
// enough to tell the two link labels apart.
vi.mock("next-intl/server", () => ({
  getTranslations:
    async ({ locale, namespace }: { locale: string; namespace?: string }) =>
    (key: string) =>
      `${locale}:${namespace ?? "none"}:${key}`,
}));

// next/font/local is a build time transform; outside next build the module is
// a plain function export that throws.
vi.mock("@/fonts", () => ({ fontVariables: "font-vars" }));

// next-themes reads window.matchMedia on mount; the wrapper is transparent to
// the markup this test is about.
vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import GlobalNotFound from "./global-not-found";

async function renderAt(path: string): Promise<string> {
  pathname.value = path;
  return renderToStaticMarkup(await GlobalNotFound());
}

function anchors(html: string): { href: string; tag: string; text: string }[] {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((match) => ({
    tag: match[1] ?? "",
    text: match[2] ?? "",
    href: /href="([^"]*)"/.exec(match[1] ?? "")?.[1] ?? "",
  }));
}

function homeLinks(html: string) {
  return anchors(html).filter((link) => link.text.endsWith(":backHome"));
}

describe("global 404 home links", () => {
  beforeEach(() => {
    pathname.value = "/";
  });

  it("sends the English 404 to the English home and offers Turkish", async () => {
    const html = await renderAt("/en/does-not-exist");
    expect(html).toContain('lang="en"');
    const homes = homeLinks(html);
    expect(homes).toHaveLength(2);
    expect(homes[0]?.href).toBe("/en");
    expect(homes[0]?.text).toBe("en:notFound:backHome");
    expect(homes[0]?.tag).not.toContain("hrefLang");
    expect(homes[1]?.href).toBe("/");
    expect(homes[1]?.tag).toContain('hrefLang="tr"');
    expect(homes[1]?.text).toBe("tr:notFound:backHome");
  });

  it("sends the Turkish 404 to the Turkish home, not the English one", async () => {
    // The secondary locale used to be derived from routing.defaultLocale at
    // module scope, so it was "tr" on a Turkish 404 too: the whole secondary
    // block was skipped as a duplicate and the one remaining link was a
    // hardcoded href="/" under the Turkish label.
    const html = await renderAt("/olmayan");
    expect(html).toContain('lang="tr"');
    const homes = homeLinks(html);
    expect(homes).toHaveLength(2);
    expect(homes[0]?.href).toBe("/");
    expect(homes[0]?.text).toBe("tr:notFound:backHome");
    expect(homes[1]?.href).toBe("/en");
    expect(homes[1]?.tag).toContain('hrefLang="en"');
    expect(homes[1]?.text).toBe("en:notFound:backHome");
  });

  it("falls back to the default locale when the pathname header is missing", async () => {
    const html = await renderAt("");
    expect(html).toContain('lang="tr"');
    expect(homeLinks(html)[0]?.href).toBe("/");
  });

  it("offers projects, writing and contact in the page locale", async () => {
    const html = await renderAt("/olmayan");
    const links = anchors(html);
    expect(links.map((link) => link.href)).toEqual(
      expect.arrayContaining(["/projeler", "/yazilar", "/iletisim"])
    );
  });
});
