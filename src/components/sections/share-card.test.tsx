// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { resolveServerTree } from "../../../tests/helpers/render";
import en from "../../../messages/en.json";
import tr from "../../../messages/tr.json";

// ShareCard reads getTranslations() ambiently, the way it would inside a real
// request; this render never enters that request scope. The stub serves the
// real catalogs so a key that goes missing fails here instead of rendering an
// empty string. activeLocale stands in for the request locale.
let activeLocale: "en" | "tr" = "en";

vi.mock("next-intl/server", () => ({
  getTranslations: async (arg?: string | { namespace?: string }) => {
    const namespace = typeof arg === "string" ? arg : arg?.namespace;
    const messages = (await import(`../../../messages/${activeLocale}.json`))
      .default as Record<string, unknown>;
    return (key: string, values?: Record<string, unknown>) => {
      const path = namespace ? `${namespace}.${key}` : key;
      const raw = path
        .split(".")
        .reduce<unknown>(
          (node, segment) => (node as Record<string, unknown>)?.[segment],
          messages
        );
      if (typeof raw !== "string") {
        throw new Error(`missing message key: ${activeLocale}.${path}`);
      }
      if (!values) return raw;
      return Object.entries(values).reduce(
        (text, [name, value]) => text.replace(`{${name}}`, String(value)),
        raw
      );
    };
  },
}));

const { ShareCard } = await import("@/components/sections/share-card");
const { contentUrl } = await import("@/lib/seo/alternates");
const { ogImageHref } = await import("@/i18n/navigation");

const TITLE = 'Tom & Jerry\'s "quotes" <tags>';

async function renderCard(
  locale: "en" | "tr",
  kind: "post" | "project",
  slug: string,
  title: string = TITLE
) {
  activeLocale = locale;
  return render(
    await resolveServerTree(
      <ShareCard locale={locale} kind={kind} slug={slug} title={title} />
    )
  );
}

describe("share card", () => {
  it("shows the page's own card, not the site identity one", async () => {
    const { container } = await renderCard("tr", "post", "a-slug");
    const image = container.querySelector("img");

    // The metadata image route of this very page. A card built from the
    // identity image would be a picture of something the page never publishes.
    expect(image?.getAttribute("src")).toBe(
      ogImageHref("tr", "post", "a-slug")
    );
    expect(image?.getAttribute("src")).toBe(
      "/yazilar/a-slug/opengraph-image/default"
    );
    expect(image?.getAttribute("width")).toBe("1200");
    expect(image?.getAttribute("height")).toBe("630");
    expect(image?.getAttribute("loading")).toBe("lazy");
    // unoptimized: the src is served verbatim rather than through /_next/image.
    expect(image?.getAttribute("src")).not.toContain("/_next/image");
    expect(image?.getAttribute("srcset")).toBeNull();
  });

  it("prefixes the card path in the non default locale", async () => {
    const { container } = await renderCard("en", "project", "hubit");

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/en/projects/hubit/opengraph-image/default"
    );
  });

  it("keeps the picture at the ratio the card is drawn at", async () => {
    const { container } = await renderCard("tr", "post", "a-slug");
    const className = container.querySelector("img")?.className ?? "";

    // Without h-auto the intrinsic height attribute survives the w-full
    // override and the 1200:630 card renders squashed.
    expect(className).toContain("w-full");
    expect(className).toContain("h-auto");
    expect(className).toContain("max-w-[35rem]");
    expect(className).toContain("border-border");
  });

  it("describes the image with the same alt the card is published with", async () => {
    await renderCard("en", "post", "a-slug", "A post title");

    expect(
      screen.getByAltText(
        en.metadata.ogAltPage.replace("{title}", "A post title")
      )
    ).toBeInTheDocument();
  });

  it.each([
    ["en", en],
    ["tr", tr],
  ] as const)("labels the block in %s", async (locale, messages) => {
    await renderCard(locale, "post", "a-slug");

    expect(
      screen.getByRole("heading", { name: messages.share.title })
    ).toBeInTheDocument();
    expect(screen.getByText(messages.share.lead)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: messages.share.title })
    ).toBeInTheDocument();
  });

  it("encodes the title and the absolute url into every share target", async () => {
    await renderCard("tr", "post", "a-slug");

    const url = contentUrl("tr", "post", "a-slug");
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(TITLE);

    const hrefOf = (name: string) =>
      screen.getByRole("link", { name }).getAttribute("href");

    expect(hrefOf(tr.share.x)).toBe(
      `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`
    );
    expect(hrefOf(tr.share.linkedin)).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    );
    expect(hrefOf(tr.share.whatsapp)).toBe(
      `https://wa.me/?text=${encodeURIComponent(`${TITLE} ${url}`)}`
    );
    expect(hrefOf(tr.share.email)).toBe(
      `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
    );

    // The & in the title would otherwise end the parameter it sits in and
    // hand the rest of the string to the next one, so a title is enough to
    // rewrite the url a reader posts. The apostrophe is left raw on purpose:
    // encodeURIComponent treats it as unreserved and it delimits nothing.
    for (const [label, parameters] of [
      [tr.share.x, 2],
      [tr.share.whatsapp, 1],
      [tr.share.email, 2],
    ] as const) {
      const href = hrefOf(label) ?? "";
      const query = href.slice(href.indexOf("?") + 1);

      expect(query.split("&"), label).toHaveLength(parameters);
      expect(href).not.toContain("<tags>");
      expect(href).not.toContain('"quotes"');
    }
  });

  it("sends the whatsapp link to the share sheet, not to the owner's number", async () => {
    await renderCard("tr", "post", "a-slug");

    // whatsappHref in src/lib/site.ts opens a chat with the owner; this is a
    // reader passing the page on, not messaging him.
    const href =
      screen
        .getByRole("link", { name: tr.share.whatsapp })
        .getAttribute("href") ?? "";
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
  });

  it("opens the web targets in a new tab without leaking the opener, and mailto in place", async () => {
    const { container } = await renderCard("en", "post", "a-slug");
    const links = [...container.querySelectorAll("a")];

    expect(links).toHaveLength(4);
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("mailto:")) {
        // A mail handler is not a document; target=_blank would leave an
        // empty tab behind in several browsers.
        expect(link.hasAttribute("target")).toBe(false);
        expect(link.hasAttribute("rel")).toBe(false);
      } else {
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      }
      // A title attribute would duplicate the visible label as a tooltip
      // that touch users never get.
      expect(link.hasAttribute("title")).toBe(false);
    }
  });

  it("gives every share control a 44px target", async () => {
    const { container } = await renderCard("en", "post", "a-slug");

    for (const element of container.querySelectorAll("a, button")) {
      expect(element.className, element.textContent ?? "").toContain(
        "tap-target"
      );
    }
  });

  it("prints the url as selectable text next to the copy button", async () => {
    await renderCard("en", "project", "hubit");

    // The fallback when the clipboard is unavailable or refuses.
    expect(
      screen.getByText("https://dogancanyildiz.com/en/projects/hubit")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: en.share.copy })
    ).toBeInTheDocument();
  });
});
