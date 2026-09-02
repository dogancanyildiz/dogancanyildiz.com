import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/**
 * The CTA ladder gives every surface its own rung, so no two calls on a page
 * reach for the same word. "general" is the default block the home, About and
 * writing pages close on; "project" is the variant the project list and the
 * project detail page use, worded around the system a reader has just been
 * looking at rather than around work in the abstract.
 */
type ContactCtaScope = "general" | "project";

interface ContactCtaProps {
  scope?: ContactCtaScope;
}

export async function ContactCta({ scope = "general" }: ContactCtaProps = {}) {
  const t = await getTranslations("contact");
  const project = scope === "project";

  return (
    <div className="flex flex-col gap-5 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl space-y-1.5">
        <p className="meta-label">{t("title")}</p>
        <h2 className="section-heading">
          {t(project ? "projectCtaTitle" : "ctaTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(project ? "projectCtaBody" : "ctaBody")}
        </p>
      </div>
      <Button asChild size="lg" className="shrink-0">
        <Link href="/contact">
          {t(project ? "projectCtaButton" : "ctaButton")}
          <ArrowUpRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
