/* eslint-disable @next/next/no-html-link-for-pages --
 * The home link has to be a plain anchor. This document renders its own html
 * element and so does src/app/[lang]/layout.tsx, so a client side navigation
 * from here would try to swap one document root for another. A full page load
 * is the correct exit from a failed render.
 */
"use client";

import "./globals.css";
import { fontVariables } from "@/fonts";

/**
 * Last resort boundary: it replaces the root layout, so it renders its own
 * html and body and cannot use the header, the footer or next-intl.
 *
 * The locale is unknowable here (the layout that carried the `[lang]` segment
 * is exactly what failed), so the copy is fixed: English first, Turkish
 * second, each line tagged with its own lang attribute so a screen reader
 * switches voice. There is no metadata export either, because a client
 * component cannot have one.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <title>Something went wrong</title>
        <main className="flex min-h-screen items-center">
          <section className="section-space w-full">
            <div className="page-shell flex flex-col items-start gap-6">
              <h1 className="max-w-3xl text-4xl leading-[1.05] sm:text-5xl">
                Something went wrong
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                This page could not be loaded. Try again, or go back to the home
                page.
              </p>
              <p
                lang="tr"
                className="max-w-xl text-base leading-7 text-muted-foreground"
              >
                Bir şeyler ters gitti. Bu sayfa yüklenemedi. Yeniden deneyin ya
                da ana sayfaya dönün.
              </p>
              {error.digest ? (
                <p className="text-sm text-muted-foreground">
                  Error reference: <code>{error.digest}</code>
                </p>
              ) : null}
              <div className="flex flex-wrap gap-5">
                <button
                  type="button"
                  onClick={() => retry()}
                  className="text-base font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Try again
                </button>
                <a
                  className="text-base font-semibold text-primary underline-offset-4 hover:underline"
                  href="/"
                >
                  Back to home
                </a>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
