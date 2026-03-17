"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Briefcase } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { ContactForm } from "@/components/sections/contact-form";

export function ContactPageContent() {
  const { t } = useLocale();

  return (
    <section className="relative px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("contact.title")}
        </h1>
        <p className="mb-10 text-muted-foreground">
          {t("contact.subtitle")}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-wrap gap-6 rounded-lg border border-border bg-muted/30 p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-foreground">{t("contact.location")}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <a
              href={`mailto:${t("contact.email")}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {t("contact.email")}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Briefcase className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-foreground">{t("contact.availability")}</span>
          </div>
        </motion.div>

        <ContactForm />
      </div>
    </section>
  );
}
