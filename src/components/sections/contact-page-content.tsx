"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Mail, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/sections/contact-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { fadeUp } from "@/lib/motion";
import { CONTACT_EMAIL_PUBLIC } from "@/lib/site";

export function ContactPageContent() {
  const t = useTranslations("contact");
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);

  return (
    <section className="section-space relative">
      <div className="page-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <SectionHeading as="h1" title={t("title")} description={t("intro")} />

          <m.div
            variants={variants}
            initial="hidden"
            animate="show"
            custom={0}
            className="surface-panel space-y-3 p-6"
          >
            <div className="rounded-[1.25rem] border border-border/70 bg-background/55 p-4">
              <div className="flex items-center gap-3">
                <Mail
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("emailLabel")}
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL_PUBLIC}`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {CONTACT_EMAIL_PUBLIC}
                  </a>
                </div>
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-background/55 p-4">
              <div className="flex items-center gap-3">
                <MapPin
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("locationLabel")}
                  </p>
                  <span className="text-sm text-foreground">
                    {t("location")}
                  </span>
                </div>
              </div>
            </div>
          </m.div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
