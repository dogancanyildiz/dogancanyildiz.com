import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";

describe("i18n routing", () => {
  it("serves English at the root and Turkish under a prefix", () => {
    expect(routing.locales).toEqual(["en", "tr"]);
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localePrefix).toBe("as-needed");
  });

  it("never redirects based on Accept-Language or cookies", () => {
    expect(routing.localeDetection).toBe(false);
    expect(routing.localeCookie).toBe(false);
  });
});
