/* eslint-disable @next/next/no-html-link-for-pages --
 * The links below have to be plain anchors. This document renders its own html
 * element and so does src/app/[lang]/layout.tsx, so a client side navigation
 * from here into the app would try to swap one document root for another. A
 * full page load is the correct exit from a 404.
 */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import "./globals.css";
import { fontVariables } from "@/fonts";
import { routing } from "@/i18n/routing";
import { localeFromPathname } from "@/lib/locale-from-pathname";
import { ThemeProvider } from "@/components/theme-provider";

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
 */

const secondaryLocale = routing.locales.find(
  (locale) => locale !== routing.defaultLocale
);

async function documentLocale(): Promise<(typeof routing.locales)[number]> {
  const pathname = (await headers()).get("x-pathname") ?? "";
  return localeFromPathname(pathname);
}

async function messages(locale: string) {
  return getTranslations({ locale, namespace: "notFound" });
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await documentLocale();
  const t = await messages(locale);
  return { title: t("title") };
}

export default async function GlobalNotFound() {
  const locale = await documentLocale();
  const t = await messages(locale);
  const secondary = secondaryLocale && secondaryLocale !== locale
    ? await messages(secondaryLocale)
    : null;

  return (
    <html
      lang={locale}
      className={fontVariables}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex min-h-screen items-center">
            <section className="section-space w-full">
              <div className="page-shell flex flex-col items-start gap-6">
                <span className="eyebrow">{t("code")}</span>
                <h1 className="max-w-3xl text-4xl leading-[1.05] sm:text-5xl">
                  {t("title")}
                </h1>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  {t("description")}
                </p>
                {secondary && secondaryLocale ? (
                  <p
                    lang={secondaryLocale}
                    className="max-w-xl text-base leading-7 text-muted-foreground"
                  >
                    {secondary("title")}. {secondary("description")}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-5">
                  <a
                    className="text-base font-semibold text-primary underline-offset-4 hover:underline"
                    href="/"
                  >
                    {t("backHome")}
                  </a>
                  {secondary && secondaryLocale ? (
                    <a
                      className="text-base font-semibold text-primary underline-offset-4 hover:underline"
                      hrefLang={secondaryLocale}
                      lang={secondaryLocale}
                      href={`/${secondaryLocale}`}
                    >
                      {secondary("backHome")}
                    </a>
                  ) : null}
                </div>
              </div>
            </section>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
