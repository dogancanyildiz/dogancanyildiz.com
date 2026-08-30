/*
 * The links below have to be plain anchors. This document renders its own html
 * element and so does src/app/[lang]/layout.tsx, so a client side navigation
 * from here into the app would try to swap one document root for another. A
 * full page load is the correct exit from a 404.
 *
 * Both hrefs are computed, so @next/next/no-html-link-for-pages (which only
 * inspects literal href strings) has nothing to report and an eslint-disable
 * for it would itself be flagged as unused. Put the directive back if a
 * literal path ever returns here.
 */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import "./globals.css";
import { fontVariables } from "@/fonts";
import { routing } from "@/i18n/routing";
import { localeFromPathname } from "@/lib/locale-from-pathname";
import { localePath } from "@/lib/seo/alternates";
import { ThemeProvider } from "@/components/theme-provider";
import {
  StatusScreen,
  statusLinksFor,
} from "@/components/status/status-screen";

/**
 * 404 document for every path the router cannot match.
 *
 * The root layout of this app lives at src/app/[lang]/layout.tsx, so a request
 * that never resolves to a locale has no layout to render: without this file
 * Next serves a bare document with no stylesheet and no html lang attribute.
 * This file therefore renders its own html and body and cannot reuse the
 * locale layout or its header and footer.
 *
 * There is no [lang] segment here, so the locale is inferred from the
 * request pathname (x-pathname, set in src/proxy.ts). When that header is
 * missing, the document falls back to the default locale.
 *
 * While experimental.globalNotFound is on this is the only 404 in the app: a
 * notFound() thrown inside a locale lands here too, not on
 * src/app/[lang]/not-found.tsx, so a bad slug also gets this bare document
 * rather than the header and footer.
 */

type Locale = (typeof routing.locales)[number];

/**
 * The other locale has to be derived from the locale actually being rendered,
 * not from the default one. Picking `locales.find(l => l !== defaultLocale)`
 * at module scope resolved to "tr" for every request, so on a Turkish 404 the
 * secondary block was suppressed as a duplicate and the only remaining link
 * was the hardcoded "/" carrying the Turkish label: it sent the reader to the
 * English home page and offered no way across to the Turkish one.
 */
async function documentLocale(): Promise<Locale> {
  const pathname = (await headers()).get("x-pathname") ?? "";
  return localeFromPathname(pathname);
}

async function messages(locale: string, namespace: string) {
  return getTranslations({ locale, namespace });
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await documentLocale();
  const t = await getTranslations({ locale, namespace: "notFound" });
  return { title: t("title") };
}

export default async function GlobalNotFound() {
  const locale = await documentLocale();
  const t = await messages(locale, "notFound");
  const tNav = await messages(locale, "nav");
  const tBrand = await messages(locale, "brand");
  const secondaryLocale = routing.locales.find((other) => other !== locale);
  const secondary = secondaryLocale
    ? await messages(secondaryLocale, "notFound")
    : null;

  const links = [
    ...statusLinksFor(locale, {
      home: t("backHome"),
      projects: tNav("projects"),
      blog: tNav("blog"),
      contact: tNav("contact"),
    }),
    ...(secondary && secondaryLocale
      ? [
          {
            href: localePath(secondaryLocale, "/"),
            label: secondary("backHome"),
            hrefLang: secondaryLocale,
            lang: secondaryLocale,
            primary: true as const,
          },
        ]
      : []),
  ];

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex min-h-screen items-center">
            <section className="section-space w-full">
              <div className="page-shell">
                <StatusScreen
                  brandName={tBrand("name")}
                  eyebrow={t("code")}
                  title={t("title")}
                  description={t("description")}
                  extra={
                    secondary && secondaryLocale ? (
                      <p
                        lang={secondaryLocale}
                        className="max-w-xl text-base leading-7 text-muted-foreground"
                      >
                        {secondary("title")}. {secondary("description")}
                      </p>
                    ) : null
                  }
                  links={links}
                />
              </div>
            </section>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
