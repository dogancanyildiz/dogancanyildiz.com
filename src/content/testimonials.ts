import type { Locale } from "@/lib/content";

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  /** Optional project or engagement context shown after the role. */
  context?: string;
  company?: string;
}

/**
 * Social proof quotes. Leave empty until real references are approved.
 * When entries are added here, the About page band renders automatically.
 */
export const testimonials: Record<Locale, Testimonial[]> = {
  en: [],
  tr: [],
};
