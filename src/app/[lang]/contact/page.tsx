import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { resolveLocale } from "@/lib/route-params";
import { ContactPageContent } from "@/components/sections/contact-page-content";
import { Breadcrumb } from "@/components/seo/breadcrumb";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "contact" });

  return buildPageMetadata(
    locale,
    { kind: "static", path: "/contact" },
    {
      title: t("title"),
      description: t("description"),
    }
  );
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contact" });

  // contact is the largest namespace in the catalog and this is the only
  // route that renders a client component reading it (the form), so the
  // shell provider in src/app/[lang]/layout.tsx leaves it out and this
  // route serves it to its own subtree instead. A nested provider replaces
  // the catalog rather than merging into the one above it, so nothing under
  // here may read a shell namespace: ContactForm is the only "use client"
  // component in this subtree and it reads contact.form alone.
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={{ contact: messages.contact }}>
      <ContactPageContent
        breadcrumb={
          <Breadcrumb locale={locale} items={[{ name: t("title") }]} />
        }
      />
    </NextIntlClientProvider>
  );
}
