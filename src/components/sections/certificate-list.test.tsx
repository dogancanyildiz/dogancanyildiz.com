// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { resolveServerTree } from "../../../tests/helpers/render";
import { certificateGroupsFor, certificates } from "@/content/profile";

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
    expect(container.querySelectorAll("img")).toHaveLength(withBadges.length);
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

    expect(image?.getAttribute("width")).toBe("340");
    expect(image?.getAttribute("height")).toBe("340");
    // A border would draw a box around artwork that is not a box.
    expect(image?.className).not.toContain("border");
    expect(image?.className).toContain("object-contain");
  });

  it("gives each row a single link, and none to the row without one", async () => {
    const { container } = await renderList("en");
    const linked = certificates.en.filter((entry) => entry.verifyUrl);

    expect(container.querySelectorAll("a")).toHaveLength(linked.length);
    for (const item of container.querySelectorAll("li")) {
      expect(item.querySelectorAll("a").length).toBeLessThanOrEqual(1);
    }

    const orphan = [...container.querySelectorAll("li")].find((item) =>
      item.textContent?.includes(GLOBAL_AI_HUB)
    );
    expect(orphan).toBeDefined();
    expect(orphan?.querySelector("a")).toBeNull();
    expect(orphan?.querySelector("img")).toBeNull();
    // No apology for the missing link either: the row simply stops.
    expect(orphan?.textContent).toContain("Global AI Hub");
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
