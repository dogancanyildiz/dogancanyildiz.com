import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ContactPageContent } from "@/components/sections/contact-page-content";

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  setRequestLocale(lang);

  return <ContactPageContent />;
}
