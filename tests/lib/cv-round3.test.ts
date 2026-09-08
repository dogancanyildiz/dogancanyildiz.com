import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const { existsSync } = vi.hoisted(() => ({ existsSync: vi.fn() }));

vi.mock("node:fs", () => ({ existsSync }));

afterEach(() => {
  vi.resetModules();
  existsSync.mockReset();
});

async function loadCv() {
  return import("@/lib/cv");
}

describe("hasCv", () => {
  it("is true once the PDF for that locale is present at its own path", async () => {
    existsSync.mockReturnValue(true);
    const { hasCv } = await loadCv();

    expect(hasCv("tr")).toBe(true);
    expect(existsSync).toHaveBeenCalledWith(
      join(process.cwd(), "public", "cv", "dogancanyildiz-cv-tr.pdf")
    );

    expect(hasCv("en")).toBe(true);
    expect(existsSync).toHaveBeenCalledWith(
      join(process.cwd(), "public", "cv", "dogancanyildiz-cv-en.pdf")
    );
  });

  it("is false before the PDF has been delivered, so the download button never renders as a broken link", async () => {
    existsSync.mockReturnValue(false);
    const { hasCv } = await loadCv();

    expect(hasCv("tr")).toBe(false);
  });
});

describe("availableCvLocales", () => {
  it("lists the page locale first and the other edition after it", async () => {
    existsSync.mockReturnValue(true);
    const { availableCvLocales } = await loadCv();

    expect(availableCvLocales("tr")).toEqual(["tr", "en"]);
    expect(availableCvLocales("en")).toEqual(["en", "tr"]);
  });

  it("drops an edition whose file is missing instead of linking to a 404", async () => {
    existsSync.mockImplementation((path: string) =>
      String(path).endsWith("dogancanyildiz-cv-en.pdf")
    );
    const { availableCvLocales } = await loadCv();

    expect(availableCvLocales("tr")).toEqual(["en"]);
  });
});
