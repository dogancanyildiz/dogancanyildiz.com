"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Briefcase, Clock3 } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { ContactForm } from "@/components/sections/contact-form";
import { SectionHeading } from "@/components/ui/section-heading";

export function ContactPageContent() {
  const { t } = useLocale();

  return (
    <section className="section-space relative">
      <div className="page-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow={t("contact.eyebrow")}
            title={t("contact.title")}
            description={t("contact.subtitle")}
          />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-panel space-y-5 p-6"
          >
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {t("contact.cardTitle")}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("contact.cardBody")}
              </p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-[1.25rem] border border-border/70 bg-background/55 p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {t("contact.location")}
                  </span>
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/55 p-4">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <a
                    href={`mailto:${t("contact.email")}`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {t("contact.email")}
                  </a>
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/55 p-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {t("contact.availability")}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-panel p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {t("contact.responseTitle")}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("contact.responseBody")}
              </p>
            </div>
            <div className="surface-panel p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {t("contact.workingTitle")}
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("contact.workingBody")}
              </p>
            </div>
            <div className="surface-panel flex items-start gap-3 p-5 sm:col-span-2">
              <Clock3 className="mt-1 size-4 shrink-0 text-primary" />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {t("contact.availabilityTitle")}
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("contact.availabilityBody")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
