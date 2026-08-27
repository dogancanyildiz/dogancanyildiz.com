import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { translations } from "@/lib/i18n/translations";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "tr" ? "tr" : "en";
  const m = translations[locale].metadata;
  return {
    title: { default: m.defaultTitle, template: `%s | ${m.defaultTitle}` },
    description: m.defaultDescription,
    openGraph: {
      title: m.defaultTitle,
      description: m.defaultDescription,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale =
    cookieStore.get("NEXT_LOCALE")?.value === "tr" ? "tr" : "en";

  return (
    <html lang={initialLocale === "tr" ? "tr" : "en"} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider initialLocale={initialLocale}>
            <Header />
            <main className="min-h-[calc(100vh-7rem)]">{children}</main>
            <Footer />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
