import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const { existsSync } = vi.hoisted(() => ({ existsSync: vi.fn() }));

vi.mock("node:fs", () => ({ existsSync }));

afterEach(() => {
  vi.resetModules();
  existsSync.mockReset();
});

async function loadHasCv() {
  const mod = await import("@/lib/cv");
  return mod.hasCv;
}

describe("hasCv", () => {
  it("is true once the CV PDF is present at the expected path", async () => {
    existsSync.mockReturnValue(true);
    const hasCv = await loadHasCv();

    expect(hasCv()).toBe(true);
    expect(existsSync).toHaveBeenCalledWith(
      join(process.cwd(), "public", "cv", "dogancanyildiz-cv.pdf")
    );
  });

  it("is false before the CV PDF has been delivered, so the download button never renders as a broken link", async () => {
    existsSync.mockReturnValue(false);
    const hasCv = await loadHasCv();

    expect(hasCv()).toBe(false);
  });
});
