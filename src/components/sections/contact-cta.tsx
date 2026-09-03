import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * The CTA ladder gives every surface its own rung, so no two calls on a page
 * reach for the same word. "general" is the default block the home, About and
 * writing pages close on; "project" is the variant the project list and the
 * project detail page use, worded around the system a reader has just been
 * looking at rather than around work in the abstract; "services" closes the
 * services page, worded around the scope a prospect has to describe before a
 * fixed price is possible.
 */
type ContactCtaScope = "general" | "project" | "services";

interface ContactCtaProps {
  scope?: ContactCtaScope;
}

// Each scope names its own title/body/button triple in the contact namespace,
// so the block stays one component and the copy stays in the catalog.
const CTA_KEYS = {
  general: {
    title: "ctaTitle",
    body: "ctaBody",
    button: "ctaButton",
  },
  project: {
    title: "projectCtaTitle",
    body: "projectCtaBody",
    button: "projectCtaButton",
  },
  services: {
    title: "servicesCtaTitle",
    body: "servicesCtaBody",
    button: "servicesCtaButton",
  },
} as const;

export async function ContactCta({ scope = "general" }: ContactCtaProps = {}) {
  const t = await getTranslations("contact");
  const keys = CTA_KEYS[scope];

  return (
    <div className="flex flex-col gap-5 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl space-y-1.5">
        <p className="meta-label">{t("title")}</p>
        <h2 className="section-heading">{t(keys.title)}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(keys.body)}
        </p>
      </div>
      <Button asChild size="lg" className="shrink-0">
        <Link href="/contact">
          {t(keys.button)}
          <ArrowUpRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
