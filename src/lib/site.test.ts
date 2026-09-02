import { describe, expect, it } from "vitest";

import { WHATSAPP_NUMBER, whatsappHref } from "./site";

describe("whatsappHref", () => {
  it("builds a wa.me chat link with the digits only number and encoded text", () => {
    expect(WHATSAPP_NUMBER).toMatch(/^\d+$/);
    expect(WHATSAPP_NUMBER).toBe("905543828000");

    const href = whatsappHref("Hello, I am writing from your site.");
    expect(href.startsWith(`https://wa.me/${WHATSAPP_NUMBER}?text=`)).toBe(
      true
    );
    expect(href).toContain(
      encodeURIComponent("Hello, I am writing from your site.")
    );
    expect(href).not.toContain("+90");
  });
});
