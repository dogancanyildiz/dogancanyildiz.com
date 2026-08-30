import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/lib/route-params";
import {
  StatusRouteContent,
  statusPageMetadata,
} from "@/components/status/status-route-content";

interface ComingSoonPageProps {
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: ComingSoonPageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return statusPageMetadata(locale, "construction");
}

export default async function ComingSoonPage({ params }: ComingSoonPageProps) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  return <StatusRouteContent locale={locale} variant="construction" />;
}
