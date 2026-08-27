"use client";

import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { Mail, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/sections/contact-form";
import { PageSection } from "@/components/layout/page-section";
import { PageHeader } from "@/components/ui/page-header";
import { fadeUp, MOTION_ITEM_CLASS } from "@/lib/motion";
import { CONTACT_EMAIL_PUBLIC } from "@/lib/site";

export function ContactPageContent() {
  const t = useTranslations("contact");
  const reduced = useReducedMotion() ?? false;
  const variants = fadeUp(reduced);

  return (
    <PageSection innerClassName="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="space-y-6">
        <PageHeader as="h1" title={t("title")} description={t("intro")} />

        <m.div
          variants={variants}
          initial="hidden"
          animate="show"
          custom={0}
          className={`space-y-4 ${MOTION_ITEM_CLASS}`}
        >
          <div className="flex items-start gap-3">
            <Mail
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="meta-label">{t("emailLabel")}</p>
              <a
                href={`mailto:${CONTACT_EMAIL_PUBLIC}`}
                className="break-all text-sm text-primary underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL_PUBLIC}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <p className="meta-label">{t("locationLabel")}</p>
              <span className="text-sm text-foreground">{t("location")}</span>
            </div>
          </div>
        </m.div>

        <m.div
          variants={variants}
          initial="hidden"
          animate="show"
          custom={1}
          className={`space-y-2 border-t border-border pt-6 ${MOTION_ITEM_CLASS}`}
        >
          <p className="meta-label">{t("trustTitle")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("trustBody")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("responseExpectation")}
          </p>
        </m.div>
      </div>

      <div className="space-y-4">
        <ContactForm />
      </div>
    </PageSection>
  );
}
