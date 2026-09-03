// @vitest-environment jsdom
import type { ComponentType, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl, type TestLocale } from "../../../tests/helpers/render";
import { mdxComponents } from "./mdx-components";

// The `a` override is what turns an internal link written in an MDX body into
// a client-side, locale-correct next-intl link instead of a plain full-reload
// anchor. These tests pin that behaviour: an internal path renders through the
// next-intl Link (localized, prefixed on en, untouched on tr), while external
// links and bare anchors stay ordinary anchors.
const MdxAnchor = mdxComponents.a as ComponentType<{
  href?: string;
  children?: ReactNode;
}>;

function renderAnchor(href: string, locale: TestLocale) {
  renderWithIntl(<MdxAnchor href={href}>link text</MdxAnchor>, { locale });
  return screen.getByRole("link", { name: "link text" });
}

describe("mdx anchor override", () => {
  it("localizes a known internal pathname and prefixes it on en", () => {
    // /about is a routed pathname; on the English locale it carries the /en
    // prefix that a plain <a href="/about"> would have skipped.
    expect(renderAnchor("/about", "en")).toHaveAttribute("href", "/en/about");
  });

  it("prefixes a concrete en content path that is not a pathname key", () => {
    expect(
      renderAnchor("/projects/ticket-purchasing-system", "en")
    ).toHaveAttribute("href", "/en/projects/ticket-purchasing-system");
  });

  it("keeps a default-locale (tr) path unprefixed", () => {
    // tr is the default locale, so the same override adds no prefix and the
    // Turkish public path written in the tr content file renders unchanged.
    expect(
      renderAnchor("/projeler/bilet-satin-alma-sistemi", "tr")
    ).toHaveAttribute("href", "/projeler/bilet-satin-alma-sistemi");
  });

  it("carries an anchor fragment through to the certificates section", () => {
    expect(renderAnchor("/about#about-certificates", "en")).toHaveAttribute(
      "href",
      "/en/about#about-certificates"
    );
  });

  it("leaves an external link as a plain anchor", () => {
    // No locale prefix, no rewrite: an off-site URL must reach the browser
    // exactly as authored.
    expect(renderAnchor("https://example.com", "en")).toHaveAttribute(
      "href",
      "https://example.com"
    );
  });

  it("leaves a mailto link untouched", () => {
    expect(renderAnchor("mailto:developer@dogancanyildiz.com", "tr")).toHaveAttribute(
      "href",
      "mailto:developer@dogancanyildiz.com"
    );
  });
});
