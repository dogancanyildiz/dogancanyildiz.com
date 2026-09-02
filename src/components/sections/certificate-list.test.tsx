// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resolveServerTree } from "../../../tests/helpers/render";
import { certificateGroupsFor, certificates } from "@/content/profile";

/**
 * jsdom 30 ships <dialog> as an element and none of its modal behaviour:
 * showModal, close and the Escape key are all missing. What it does apply is
 * `dialog:not([open]) { display: none }` from its default stylesheet, so once
 * the open attribute is driven the visibility the queries below depend on is
 * the real thing, and the assertions read that attribute rather than trusting
 * a stub's bookkeeping.
 *
 * The polyfill is deliberately the whole of what a browser gives the
 * component: flip the attribute, fire close, and close the top dialog on
 * Escape. Everything the component itself owns (the scroll lock, the focus
 * return, the outside click) is left out so the tests can catch it.
 */
function installDialogPolyfill() {
  const proto = window.HTMLDialogElement.prototype;
  if (typeof proto.showModal === "function") return;

  const open = new Set<HTMLDialogElement>();
  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
    open.add(this);
  };
  proto.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    open.delete(this);
    this.dispatchEvent(new Event("close"));
  };
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const top = [...open].at(-1);
    top?.close();
  });
}

// CertificateList reads getTranslations()/getFormatter() ambiently, the way it
// would inside a real request; this render never enters that request scope.
// The stub serves the real catalogs, so a key that goes missing fails here
// instead of rendering an empty string, and the formatter is backed by the
// platform's own Intl, which is what next-intl wraps in production.
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
  getFormatter: async () => ({
    dateTime: (value: Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(activeLocale, options).format(value),
  }),
}));

const { CertificateList } =
  await import("@/components/sections/certificate-list");

async function renderList(locale: "en" | "tr") {
  activeLocale = locale;
  return render(await resolveServerTree(<CertificateList locale={locale} />));
}

const CAPT = "Certified Associate Penetration Tester (CAPT)";
const GLOBAL_AI_HUB = "Version Control Systems and Portfolio";

describe("certificate list", () => {
  it("prints one heading per issuer, in the order the data sets", async () => {
    const { container } = await renderList("tr");

    expect(
      [...container.querySelectorAll("h3")].map(
        (heading) => heading.textContent
      )
    ).toEqual([
      "Hackviser",
      "Cisco Networking Academy",
      "IBM SkillsBuild",
      "Global AI Hub",
    ]);
  });

  it("shows every row, with the artwork the data ships", async () => {
    const { container } = await renderList("en");

    expect(container.querySelectorAll("li")).toHaveLength(
      certificates.en.length
    );
    const withBadges = certificates.en.filter((entry) => entry.badge);
    // Two renders of the same file per credential: the 64px thumbnail on the
    // row and the large copy inside its closed preview dialog. The dialog is
    // display:none until it opens, so the second one is never fetched.
    expect(container.querySelectorAll("img")).toHaveLength(
      withBadges.length * 2
    );
    expect(container.querySelectorAll("dialog")).toHaveLength(
      withBadges.length
    );
  });

  it("names the credential in the alt text of its own artwork", async () => {
    const { container } = await renderList("en");
    const alts = [...container.querySelectorAll("img")].map((image) =>
      image.getAttribute("alt")
    );

    // The square emblems are badges; the Hackviser row is a scan of the
    // certificate itself, and says so.
    expect(alts).toContain("CyberOps Associate badge");
    expect(alts).toContain(`${CAPT} certificate`);
    for (const alt of alts) {
      expect(alt?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("translates the alt text without translating the credential name", async () => {
    const { container } = await renderList("tr");
    const alts = [...container.querySelectorAll("img")].map((image) =>
      image.getAttribute("alt")
    );

    expect(alts).toContain("CyberOps Associate rozeti");
    expect(alts).toContain(`${CAPT} sertifikası`);
  });

  it("reserves the box from the intrinsic size, unframed", async () => {
    const { container } = await renderList("en");
    const image = container.querySelector(
      'img[alt="CyberOps Associate badge"]'
    );

    expect(image?.getAttribute("width")).toBe("600");
    expect(image?.getAttribute("height")).toBe("600");
    // A border would draw a box around artwork that is not a box.
    expect(image?.className).not.toContain("border");
    expect(image?.className).toContain("object-contain");
  });

  it("gives each row a single link, and none to the row without one", async () => {
    const { container } = await renderList("en");
    const linked = certificates.en.filter((entry) => entry.verifyUrl);

    // Links inside a preview dialog are a repeat of the row's own verify link
    // for a reader who opened the artwork, and are unreachable until it does.
    const rowLinks = (scope: ParentNode) =>
      [...scope.querySelectorAll("a")].filter(
        (link) => link.closest("dialog") === null
      );

    expect(rowLinks(container)).toHaveLength(linked.length);
    for (const item of container.querySelectorAll("li")) {
      expect(rowLinks(item).length).toBeLessThanOrEqual(1);
      // And no row leads anywhere its own row link does not.
      for (const link of item.querySelectorAll("dialog a")) {
        expect(link.getAttribute("href")).toBe(
          rowLinks(item)[0]?.getAttribute("href")
        );
      }
    }

    const orphan = [...container.querySelectorAll("li")].find((item) =>
      item.textContent?.includes(GLOBAL_AI_HUB)
    );
    expect(orphan).toBeDefined();
    expect(orphan?.querySelector("a")).toBeNull();
    expect(orphan?.querySelector("img")).toBeNull();
    // No apology for the missing link either: the row stops at the name and
    // the keyword line. The issuer sits once above the group as its heading.
    expect(orphan?.textContent?.trim()).toBe(
      "Version Control Systems and PortfolioGit · GitHub · portfolio building"
    );
    const headings = [...container.querySelectorAll("h3")].map((heading) =>
      heading.textContent?.trim()
    );
    expect(headings).toContain("Global AI Hub");
  });

  it("sends every verification link off site safely", async () => {
    const { container } = await renderList("en");

    for (const link of container.querySelectorAll("a")) {
      expect(link.getAttribute("href")).toMatch(/^https:\/\//);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      // WCAG 2.5.8: the repeated "Verify" word is a real tap target.
      expect(link.className).toContain("tap-target");
    }
  });

  it("tells the repeated verify links apart for a screen reader", async () => {
    const { unmount } = await renderList("en");
    const link = screen.getByRole("link", { name: `Verify ${CAPT}` });

    expect(link.getAttribute("href")).toBe(
      "https://hackviser.com/verify?id=HV-CAPT-02TKGO4Q"
    );
    // SC 2.5.3: the accessible name opens with the word on screen.
    expect(link.textContent).toBe("Verify");
    unmount();

    await renderList("tr");
    const trLink = screen.getByRole("link", { name: `Doğrula: ${CAPT}` });
    expect(trLink.textContent).toBe("Doğrula");
  });

  it("prints the credential id only where there is one", async () => {
    const { container } = await renderList("en");

    expect(container.textContent).toContain("Credential ID HV-CAPT-02TKGO4Q");
    expect(container.textContent?.match(/Credential ID/g) ?? []).toHaveLength(
      1
    );
  });

  it("dates a row in its own locale, read in UTC", async () => {
    const en = await renderList("en");
    const enRow = [...en.container.querySelectorAll("li")].find((item) =>
      item.textContent?.includes("Introduction to Cybersecurity")
    );
    // 2026-02-02 is the second of February everywhere; a floating date would
    // slide into January for a visitor west of UTC.
    expect(
      within(enRow as HTMLElement).getByText(/February 2026/)
    ).toBeTruthy();
    expect(enRow?.querySelector("time")?.getAttribute("datetime")).toBe(
      "2026-02-02"
    );
    en.unmount();

    const tr = await renderList("tr");
    const trRow = [...tr.container.querySelectorAll("li")].find((item) =>
      item.textContent?.includes("Introduction to Cybersecurity")
    );
    expect(within(trRow as HTMLElement).getByText(/Şubat 2026/)).toBeTruthy();
  });

  it("runs the rows in two columns from md up, one hairline apiece", async () => {
    const { container } = await renderList("en");

    for (const list of container.querySelectorAll("ul")) {
      // The skills section's rhythm: one column on a phone, two from md.
      expect(list.className).toContain("md:grid-cols-2");
      expect(list.className).toContain("gap-x-8");
      // divide-y would draw between siblings in source order, which in a grid
      // is a line down the middle of a row and none above the right column.
      expect(list.className).not.toContain("divide-y");
      for (const row of list.querySelectorAll("li")) {
        expect(row.className).toContain("border-t");
        // Word bounded: the token "border-border" contains "border-b".
        expect(row.className).not.toMatch(/\bborder-b\b/);
      }
    }
  });

  it("prints the issuer's own keywords under the name, one line, in locale", async () => {
    const en = await renderList("en");
    const enRow = [...en.container.querySelectorAll("li")].find((item) =>
      item.textContent?.includes("CyberOps Associate")
    );
    expect(
      within(enRow as HTMLElement).getByText(
        "SOC monitoring · intrusion analysis · incident response · malware analysis · cryptography"
      )
    ).toBeTruthy();
    en.unmount();

    const tr = await renderList("tr");
    const trRow = [...tr.container.querySelectorAll("li")].find((item) =>
      item.textContent?.includes("CyberOps Associate")
    );
    expect(
      within(trRow as HTMLElement).getByText(
        "SOC izleme · saldırı analizi · olay müdahalesi · zararlı yazılım analizi · kriptografi"
      )
    ).toBeTruthy();
  });

  it("keeps the attendance badge at the end of its issuer's list", async () => {
    await renderList("en");
    const cisco = certificateGroupsFor("en").find(
      (group) => group.id === "cisco-networking-academy"
    );

    expect(cisco?.entries.at(-1)?.name).toBe(
      "Cisco Networking Academy Learn-A-Thon 2026"
    );
  });
});

describe("credential preview", () => {
  beforeAll(installDialogPolyfill);

  const dialogFor = (
    container: HTMLElement,
    name: string
  ): HTMLDialogElement => {
    const row = [...container.querySelectorAll("li")].find((item) =>
      item.textContent?.includes(name)
    );
    return row?.querySelector("dialog") as HTMLDialogElement;
  };

  it("makes the artwork a button that says what it opens", async () => {
    const en = await renderList("en");
    expect(
      screen.getByRole("button", { name: `Enlarge ${CAPT}` })
    ).toBeTruthy();
    // Every credential with artwork gets one, and the row without artwork
    // gets no button at all.
    const withBadges = certificates.en.filter((entry) => entry.badge);
    expect(en.container.querySelectorAll("button")).toHaveLength(
      // One trigger and one close button per preview.
      withBadges.length * 2
    );
    en.unmount();

    await renderList("tr");
    expect(screen.getByRole("button", { name: `Büyüt: ${CAPT}` })).toBeTruthy();
  });

  it("opens the same file large, named, and linked to its issuer", async () => {
    const user = userEvent.setup();
    const { container } = await renderList("en");
    const dialog = dialogFor(container, CAPT);

    expect(dialog.hasAttribute("open")).toBe(false);
    await user.click(screen.getByRole("button", { name: `Enlarge ${CAPT}` }));
    expect(dialog.hasAttribute("open")).toBe(true);

    const image = dialog.querySelector("img") as HTMLImageElement;
    // The credential name, not "{name} certificate": the row's thumbnail
    // already says what kind of artwork this is.
    expect(image.getAttribute("alt")).toBe(CAPT);
    expect(image.getAttribute("sizes")).toBe("(min-width: 768px) 600px, 90vw");
    expect(image.getAttribute("width")).toBe("1600");
    expect(image.getAttribute("height")).toBe("1031");
    expect(dialog.textContent).toContain(CAPT);

    const link = dialog.querySelector("a") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe(
      "https://hackviser.com/verify?id=HV-CAPT-02TKGO4Q"
    );
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("asks the optimizer for 64px on the row and nothing larger", async () => {
    const { container } = await renderList("en");
    const trigger = screen.getByRole("button", { name: `Enlarge ${CAPT}` });
    const thumbnail = trigger.querySelector("img") as HTMLImageElement;

    expect(thumbnail.getAttribute("sizes")).toBe("64px");
    // Same file as the large copy: one asset, two renders.
    const dialog = dialogFor(container, CAPT);
    expect(thumbnail.getAttribute("src")).toBe(
      dialog.querySelector("img")?.getAttribute("src")
    );
  });

  it("closes on the close button and hands focus back to the artwork", async () => {
    const user = userEvent.setup();
    const { container } = await renderList("en");
    const trigger = screen.getByRole("button", { name: `Enlarge ${CAPT}` });
    const dialog = dialogFor(container, CAPT);

    await user.click(trigger);
    const close = within(dialog).getByRole("button", { name: "Close preview" });
    await user.click(close);

    expect(dialog.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const { container } = await renderList("en");
    const trigger = screen.getByRole("button", { name: `Enlarge ${CAPT}` });
    const dialog = dialogFor(container, CAPT);

    await user.click(trigger);
    expect(dialog.hasAttribute("open")).toBe(true);

    await user.keyboard("{Escape}");
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("closes when the backdrop is clicked, not the panel", async () => {
    const user = userEvent.setup();
    const { container } = await renderList("en");
    const trigger = screen.getByRole("button", { name: `Enlarge ${CAPT}` });
    const dialog = dialogFor(container, CAPT);

    await user.click(trigger);
    // ::backdrop is not an element: a click on it reports the dialog itself.
    // A click inside the panel reports the panel and must not close anything.
    fireEvent.click(dialog.firstElementChild as HTMLElement);
    expect(dialog.hasAttribute("open")).toBe(true);

    fireEvent.click(dialog);
    expect(dialog.hasAttribute("open")).toBe(false);
  });

  it("locks the page behind the preview and gives it back", async () => {
    const user = userEvent.setup();
    const { container } = await renderList("en");
    const trigger = screen.getByRole("button", { name: `Enlarge ${CAPT}` });
    const dialog = dialogFor(container, CAPT);

    expect(document.body.style.overflow).toBe("");
    await user.click(trigger);
    // showModal() puts the dialog in the top layer but leaves the page under
    // it scrollable, so the modal would scroll the About page beneath itself.
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");
    expect(dialog.hasAttribute("open")).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("names the close button in the reader's own language", async () => {
    const user = userEvent.setup();
    const en = await renderList("en");
    await user.click(screen.getByRole("button", { name: `Enlarge ${CAPT}` }));
    expect(
      within(dialogFor(en.container, CAPT)).getByRole("button", {
        name: "Close preview",
      })
    ).toBeTruthy();
    en.unmount();

    const tr = await renderList("tr");
    await user.click(screen.getByRole("button", { name: `Büyüt: ${CAPT}` }));
    expect(
      within(dialogFor(tr.container, CAPT)).getByRole("button", {
        name: "Önizlemeyi kapat",
      })
    ).toBeTruthy();
  });
});
