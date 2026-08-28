import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/content";

/**
 * Awaits a `[lang]` route param and narrows it to a routed locale.
 *
 * Every page under `src/app/[lang]` needs the same three steps: await the
 * params, reject an unrouted `lang`, and hand a `Locale` to next-intl and the
 * content layer. Writing them out per page meant the guard drifted: the
 * generateMetadata functions had it, the default exports mostly did not and
 * reached for `lang as Locale` instead, which is a cast that cannot fail at
 * runtime and would have let a bad segment through as a locale. One helper
 * removes both the repetition and the casts.
 *
 * `dynamicParams = false` on the layout already rejects unknown segments
 * before a page runs, so `notFound()` here is a second line of defence rather
 * than the primary one, and it is what makes the return type honest.
 */
export async function resolveLocale(
  params: Promise<{ lang: string }>
): Promise<Locale> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  return lang;
}

/** Same guard for a route that also carries a content slug. */
export async function resolveLocaleAndSlug(
  params: Promise<{ lang: string; slug: string }>
): Promise<{ locale: Locale; slug: string }> {
  const { lang, slug } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();
  return { locale: lang, slug };
}
