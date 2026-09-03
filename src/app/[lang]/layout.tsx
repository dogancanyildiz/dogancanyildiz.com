import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import "../globals.css";
import { fontVariables } from "@/fonts";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/env";
import { buildTranslationMap } from "@/lib/content";
import { absoluteUrl, buildOpenGraph } from "@/lib/seo/alternates";
import { OG_IMAGE_PATH } from "@/lib/seo/og-image";
import { ThemeProvider } from "@/components/theme-provider";
import { UmamiTracker } from "@/components/umami-script";
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

// Mirrors --background in globals.css: light oklch(0.9846 0.0017 247.8) is
// #f9fafb in sRGB, dark oklch(0.1535 0.0072 258.4) is #0a0c0f. theme-color
// only accepts a handful of CSS colour syntaxes across browsers, so the hex
// value is restated here rather than read from the CSS custom property at
// runtime; keep the two in sync if the token in globals.css ever changes.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0c0f" },
  ],
};

// Namespaces the client tree actually reads through useTranslations. Kept
// narrow on purpose: server-only namespaces such as about, notFound,
// metadata, api and systems never cross the RSC boundary, so they never
// prefetch into every locale's client bundle. hero, home, projects and blog
// are server-only for the same reason: the sections that render them
// (hero.tsx, skills-strip.tsx, project-list.tsx, post-list.tsx) all read
// through getTranslations, so the client never asked for them either.
// tests/accessibility.test.ts ("client message payload") scans every
// "use client" component's useTranslations calls and fails if any of them
// needs a namespace missing from this list.
const CLIENT_MESSAGE_NAMESPACES = [
  "nav",
  "brand",
  "footer",
  "contact",
  "errorPage",
  "a11y",
] as const;

// The namespaces above that belong to a single route rather than to the
// shell. contact is the largest namespace in the catalog and the only client
// component that reads it is the form on /contact, so the shell leaves it
// out and src/app/[lang]/contact/page.tsx serves it to its own subtree from
// a second provider. Everything else on the list belongs to the header,
// footer or error boundary, which render on every route.
const ROUTE_SCOPED_MESSAGE_NAMESPACES = ["contact"] as const;

function pickMessages(
  messages: Record<string, unknown>,
  namespaces: readonly string[]
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const namespace of namespaces) {
    if (namespace in messages) picked[namespace] = messages[namespace];
  }
  return picked;
}

function omitMessages(
  messages: Record<string, unknown>,
  namespaces: readonly string[]
): Record<string, unknown> {
  const kept: Record<string, unknown> = {};
  for (const [namespace, value] of Object.entries(messages)) {
    if (namespaces.includes(namespace)) continue;
    kept[namespace] = value;
  }
  return kept;
}

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
    openGraph: buildOpenGraph(
      lang,
      {
        url: absoluteUrl(lang, "/"),
        imageUrl: absoluteUrl(lang, OG_IMAGE_PATH),
      },
      {
        title: t("defaultTitle"),
        description: t("defaultDescription"),
        siteName: t("siteName"),
        imageAlt: t("ogAlt"),
      }
    ),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  if (!hasLocale(routing.locales, lang)) notFound();

  // Enables static rendering for this layout and everything below it.
  setRequestLocale(lang);

  const t = await getTranslations({ locale: lang, namespace: "a11y" });
  const messages = await getMessages();
  const clientMessages = pickMessages(messages, CLIENT_MESSAGE_NAMESPACES);
  const shellMessages = omitMessages(
    clientMessages,
    ROUTE_SCOPED_MESSAGE_NAMESPACES
  );

  // Every content page's path in every locale that has it, keyed by this
  // locale's slug. The switcher is a client component in the header and the
  // page is a sibling child of this layout, so it cannot ask the page where
  // its translation lives; the layout resolves the targets instead. Missing
  // translations are simply absent, and the switcher falls back to the
  // section root for them. tests/perf/client-payload.test.ts holds the size
  // budget this puts on every page's RSC payload.
  const translations = buildTranslationMap(lang);

  return (
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={shellMessages}>
            <a href="#main" className="skip-link">
              {t("skipToContent")}
            </a>
            <Header translations={translations} />
            <main
              id="main"
              tabIndex={-1}
              className="flex-1 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
            >
              {children}
            </main>
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
        <UmamiTracker />
      </body>
    </html>
  );
}
