import type { Locale } from "@/lib/content";
import { testimonials, type Testimonial } from "@/content/testimonials";

interface TestimonialsBandProps {
  locale: Locale;
  title: string;
}

function formatAttribution(entry: Testimonial): string {
  const parts = [entry.name, entry.role];
  if (entry.company) parts.push(entry.company);
  if (entry.context) parts.push(entry.context);
  return parts.join(" · ");
}

export function TestimonialsBand({ locale, title }: TestimonialsBandProps) {
  const entries = testimonials[locale];
  if (entries.length === 0) return null;

  return (
    <section className="space-y-5 border-t border-border pt-8">
      <h2 className="section-heading">{title}</h2>
      <ul className="divide-y divide-border">
        {entries.map((entry) => (
          <li
            key={`${entry.name}-${entry.quote.slice(0, 24)}`}
            className="space-y-3 py-6 first:pt-0"
          >
            <blockquote className="text-sm leading-relaxed text-foreground/90">
              &ldquo;{entry.quote}&rdquo;
            </blockquote>
            <p className="meta-label">{formatAttribution(entry)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
