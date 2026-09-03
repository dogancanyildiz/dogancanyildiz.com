import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mdxComponents } from "@/components/content/mdx-components";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

const ABOUT = "src/app/[lang]/about/page.tsx";
const PROJECT_DETAIL = "src/app/[lang]/projects/[slug]/page.tsx";
const BLOG_DETAIL = "src/app/[lang]/blog/[slug]/page.tsx";
const PROJECTS_INDEX = "src/app/[lang]/projects/page.tsx";
const HOME = "src/app/[lang]/page.tsx";
const CERTIFICATE_LIST = "src/components/sections/certificate-list.tsx";

/**
 * Accessibility decisions revert silently. Alt text that describes the page
 * instead of the image, or a cover that repeats the h1 word for word, passes
 * every type check and every render test; the only thing that notices is a
 * screen reader. These assertions read the page source because the pages are
 * async server components with a content and next-intl dependency, and the
 * decision worth pinning is which value ends up in the attribute.
 */
describe("image alternative text", () => {
  it("describes the person in the about portrait, not the page title", () => {
    const source = read(ABOUT);

    expect(source).toContain('alt={t("profileImageAlt")}');
    expect(source).not.toContain('alt={t("title")}');
  });

  it("treats a project cover with no description as decorative", () => {
    const source = read(PROJECT_DETAIL);

    // An absent coverAlt means an empty alt, not the title: the h1 directly
    // above already says those words.
    expect(source).toContain('alt={project.coverAlt ?? ""}');
    expect(source).not.toContain("alt={project.title}");
  });

  it.each([
    ["en", en],
    ["tr", tr],
  ])(
    "%s has a portrait description to put in that attribute",
    (_l, messages) => {
      const value = (messages as { about: Record<string, string> }).about
        .profileImageAlt;

      expect(value?.trim().length ?? 0).toBeGreaterThan(0);
    }
  );
});

describe("tags and stack render as the same component everywhere", () => {
  it("uses the tag pill on the blog detail page, like the listing does", () => {
    expect(read(BLOG_DETAIL)).toContain("tag-pill");
  });

  it("uses SkillTag for the project stack instead of a joined string", () => {
    const source = read(PROJECT_DETAIL);

    expect(source).toContain("SkillTag");
    expect(source).not.toContain('project.stack.join(" · ")');
  });
});

describe("empty states", () => {
  it.each([
    ["en", en],
    ["tr", tr],
  ])(
    "%s has copy for an empty project list and an empty about list",
    (_l, m) => {
      const messages = m as {
        projects: Record<string, string>;
        about: Record<string, string>;
      };

      expect(messages.projects.empty?.trim().length ?? 0).toBeGreaterThan(0);
      expect(messages.about.emptyList?.trim().length ?? 0).toBeGreaterThan(0);
    }
  );

  it("renders that copy instead of a heading with nothing under it", () => {
    // A section whose list is empty used to print its header and then stop,
    // which reads as a broken page rather than as an empty one.
    expect(read(PROJECTS_INDEX)).toContain('t("empty")');
    expect(read(HOME)).toContain('tProjects("empty")');
    // Three sections still live in the page (experience, community,
    // education); the certificate section moved into its own component and
    // took its empty state with it.
    expect(read(ABOUT).match(/t\("emptyList"\)/g) ?? []).toHaveLength(3);
    expect(read(CERTIFICATE_LIST)).toContain('t("emptyList")');
  });
});

describe("share block placement", () => {
  it.each([
    ["blog post", BLOG_DETAIL, "post"],
    ["project", PROJECT_DETAIL, "project"],
  ])("closes the %s article on the share block", (_name, file, kind) => {
    const source = read(file);

    expect(source).toContain("<ShareCard");
    // The card belongs to the page the reader just finished, so it is handed
    // this content's own kind and slug rather than falling back to the
    // identity image.
    expect(source).toContain(`kind="${kind}"`);
    expect(source).toContain("slug={slug}");
  });

  it.each([
    ["blog post", BLOG_DETAIL],
    ["project", PROJECT_DETAIL],
  ])(
    "puts it after the %s prose and before the contact call",
    (_name, file) => {
      const source = read(file);
      const prose = source.indexOf("prose-content");
      const share = source.indexOf("<ShareCard");
      const cta = source.indexOf("<ContactCta");

      expect(prose).toBeGreaterThan(-1);
      expect(share).toBeGreaterThan(prose);
      expect(cta).toBeGreaterThan(share);
    }
  );
});

describe("mdx element overrides", () => {
  const tableOverride = mdxComponents.table;
  if (!tableOverride) {
    throw new Error("mdxComponents no longer overrides table");
  }

  it("wraps a table so a wide one scrolls in its own box", () => {
    const html = renderToStaticMarkup(
      createElement(
        tableOverride,

        {},
        createElement("tbody", null, createElement("tr", null))
      )
    );

    expect(html).toContain('<div class="table-wrap">');
    expect(html).toContain("<table>");
    expect(html).toContain("<tbody>");
  });

  it("forwards the props remark put on the table", () => {
    const html = renderToStaticMarkup(
      createElement(tableOverride, { id: "prices" })
    );

    expect(html).toContain('<table id="prices">');
  });

  it("maps only the element overrides, no unused shortcodes", () => {
    // `table` wraps wide tables for horizontal scroll; `a` routes same-site
    // links written in a body through the next-intl Link so they navigate
    // client-side and stay locale-correct (see mdx-components.test.tsx). No
    // shortcode component is mapped, since no content file reaches for one.
    expect(Object.keys(mdxComponents)).toEqual(["table", "a"]);
  });
});
