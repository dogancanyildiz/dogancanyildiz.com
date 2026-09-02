import type { routing } from "@/i18n/routing";
import type messages from "../../messages/en.json";

/**
 * Message key type safety. With this augmentation every useTranslations,
 * getTranslations and t() call is checked against the English catalog, so a
 * renamed or deleted key fails tsc instead of rendering as a raw key at
 * runtime. English is the reference catalog; tests/messages.test.ts keeps the
 * Turkish one in key parity with it.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
