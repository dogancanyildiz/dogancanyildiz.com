import { Mail, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ContactForm } from "@/components/sections/contact-form";
import { PageSection } from "@/components/layout/page-section";
import { PageHeader } from "@/components/ui/page-header";
import { WhatsAppIcon } from "@/components/ui/brand-icon";
import { CONTACT_EMAIL_PUBLIC, whatsappHref } from "@/lib/site";

export function ContactPageContent() {
  const t = useTranslations("contact");

  return (
    <PageSection innerClassName="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div className="space-y-6">
        <PageHeader as="h1" title={t("title")} description={t("intro")} />

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="meta-label">{t("emailLabel")}</p>
              {/* text-sm on its own is a 20px line box, and neither of these
                  two links sits inside a sentence, so the inline exception to
                  SC 2.5.8 does not cover them. min-h-6 is the same 24px floor
                  the project card badges take; the 44px .tap-target is for
                  standalone controls, not for a link under a label. */}
              <a
                href={`mailto:${CONTACT_EMAIL_PUBLIC}`}
                className="inline-block min-h-6 break-all text-sm text-primary underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL_PUBLIC}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <WhatsAppIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="meta-label">{t("whatsappLabel")}</p>
              <a
                href={whatsappHref(t("whatsappPrefill"))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-6 items-center text-sm text-primary underline-offset-4 hover:underline"
              >
                {t("whatsappAction")}
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
        </div>

        <div className="space-y-2 border-t border-border pt-6">
          <p className="meta-label">{t("trustTitle")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("trustBody")}
          </p>
          {/* The trust block says where a message goes; the retention detail
              lives on the Privacy page, so the claim carries a way to check
              it instead of restating the page here. */}
          <p className="text-sm leading-relaxed">
            <Link
              href="/privacy"
              className="text-primary underline-offset-4 hover:underline"
            >
              {t("privacyLink")}
            </Link>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* The reply promise belongs to the form, not to the privacy block it
            used to sit under: it is a commitment about the answer, not about
            what happens to the data. */}
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("responseExpectation")}
        </p>
        <ContactForm />
      </div>
    </PageSection>
  );
}
