import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { fontVariables } from "@/fonts";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import { getUntranslatedPaths, type Locale } from "@/lib/content";
import { buildOpenGraph } from "@/lib/seo/alternates";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/motion-provider";
import { UmamiScript } from "@/components/umami-script";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

// Params outside generateStaticParams are rejected by the router before any
// layout runs, here and in the segments below. Two effects: every content route
// stays prerendered, and an unmatched path such as /foo.txt (which the proxy
// skips, so it reaches [lang] with lang="foo.txt") gets the full
// global-not-found.tsx document instead of the bare shell that a notFound()
// thrown at request time produces.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: "metadata" });

  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: t("defaultTitle"),
      // The suffix is the bare name, not defaultTitle: defaultTitle carries
      // the role as well, and a subpage title under that template would run
      // past what a search result shows.
      template: `%s | ${t("siteName")}`,
    },
    description: t("defaultDescription"),
    // Only the home page keeps this object. Every other segment overrides it
    // with its own, otherwise it would inherit the home page url and title.
    openGraph: buildOpenGraph(lang, "/", {
      title: t("defaultTitle"),
      description: t("defaultDescription"),
      siteName: t("siteName"),
      imageAlt: t("ogAlt"),
    }),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  // Enables static rendering for this layout and everything below it.
  setRequestLocale(lang);

  const t = await getTranslations({ locale: lang, namespace: "a11y" });

  // Computed for every locale, not just the current one: the language
  // switcher needs to know, for each target locale it links to, whether the
  // current path is translated there. See src/i18n/switch-target.ts.
  const untranslated = Object.fromEntries(
    routing.locales.map((locale) => [locale, getUntranslatedPaths(locale)])
  ) as Record<Locale, string[]>;

  return (
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <MotionProvider>
              <a href="#main" className="skip-link">
                {t("skipToContent")}
              </a>
              <Header untranslated={untranslated} />
              <main
                id="main"
                tabIndex={-1}
                className="min-h-[calc(100vh-7rem)] focus-visible:outline-none"
              >
                {children}
              </main>
              <Footer />
            </MotionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <UmamiScript />
      </body>
    </html>
  );
}
