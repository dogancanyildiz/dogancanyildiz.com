import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export async function ContactCta() {
  const t = await getTranslations("contact");

  return (
    <div className="flex flex-col gap-5 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl space-y-1.5">
        <p className="meta-label">{t("title")}</p>
        <h2 className="section-heading">{t("ctaTitle")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("ctaBody")}
        </p>
      </div>
      <Button asChild size="lg" className="shrink-0">
        <Link href="/contact">
          {t("ctaButton")}
          <ArrowUpRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
