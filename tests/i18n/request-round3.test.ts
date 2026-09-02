import { describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";

// vitest runs in a plain node environment, which never sets the
// "react-server" export condition next-intl/server relies on to tell a
// Server Component build from the Client Component build it ships for
// everything else (see the "server-only" alias comment in
// vitest.config.mts). Resolved the normal way here, next-intl/server would
// hand back its Client Component stub, which throws on every call instead of
// running src/i18n/request.ts's own locale fallback logic. getRequestConfig
// is next-intl's identity wrapper around the callback passed to it
// (dist/esm/*/server/react-server/getRequestConfig.js: `return
// createRequestConfig`), so mocking it as the identity function tests
// exactly the same callback next-intl would actually invoke in production,
// without needing a per-file resolve condition override.
vi.mock("next-intl/server", () => ({
  getRequestConfig: (createRequestConfig: unknown) => createRequestConfig,
}));

async function loadRequestConfig() {
  const mod = await import("@/i18n/request");
  return mod.default;
}

describe("i18n request config", () => {
  it("keeps a supported locale from the [lang] segment and loads its catalog", async () => {
    const getRequestConfig = await loadRequestConfig();

    const config = await getRequestConfig({
      requestLocale: Promise.resolve("en"),
    });

    expect(config.locale).toBe("en");
    expect(config.messages).toEqual(en);
    expect(config.timeZone).toBe("UTC");
  });

  it("loads the other supported locale's own catalog, not a shared default", async () => {
    const getRequestConfig = await loadRequestConfig();

    const config = await getRequestConfig({
      requestLocale: Promise.resolve("tr"),
    });

    expect(config.locale).toBe("tr");
    expect(config.messages).toEqual(tr);
  });

  it("falls back to the routing default locale for a value outside routing.locales", async () => {
    // The [lang] segment acts like a catch-all for unmatched routes (e.g.
    // /unknown.txt), so an unsupported value has to resolve to a real locale
    // instead of failing the message import.
    const getRequestConfig = await loadRequestConfig();

    const config = await getRequestConfig({
      requestLocale: Promise.resolve("fr"),
    });

    expect(config.locale).toBe("tr");
    expect(config.messages).toEqual(tr);
  });

  it("falls back to the routing default locale when requestLocale is undefined", async () => {
    // Route Handlers render outside the [lang] segment, so requestLocale
    // resolves to undefined there instead of a segment value.
    const getRequestConfig = await loadRequestConfig();

    const config = await getRequestConfig({
      requestLocale: Promise.resolve(undefined),
    });

    expect(config.locale).toBe("tr");
  });

  it("keeps server and client date formatting identical regardless of locale", async () => {
    const getRequestConfig = await loadRequestConfig();

    const en_ = await getRequestConfig({
      requestLocale: Promise.resolve("en"),
    });
    const tr_ = await getRequestConfig({
      requestLocale: Promise.resolve("tr"),
    });

    expect(en_.timeZone).toBe("UTC");
    expect(tr_.timeZone).toBe("UTC");
  });
});
