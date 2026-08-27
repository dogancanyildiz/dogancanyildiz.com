"use client";

import Link from "next/link";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

const socialLinks = [
  { href: "https://github.com", labelKey: "footer.github", Icon: Github },
  { href: "https://linkedin.com", labelKey: "footer.linkedin", Icon: Linkedin },
  { href: "https://twitter.com", labelKey: "footer.twitter", Icon: Twitter },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLocale();

  return (
    <footer className="pb-6 pt-4 sm:pb-8">
      <div className="page-shell">
        <div className="surface-panel grid gap-8 px-6 py-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-8">
          <div className="space-y-4">
            <span className="eyebrow">{t("footer.availability")}</span>
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl sm:text-4xl">{t("brand")}</h2>
              <p className="section-copy">{t("footer.tagline")}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              © {year} {t("brand")}. {t("footer.copyright")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {t("footer.emailLabel")}
              </p>
              <a
                href="mailto:alex@example.com"
                className="inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-4" />
                alex@example.com
              </a>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {t("footer.elsewhere")}
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map(({ href, labelKey, Icon }) => (
                  <a
                    key={labelKey}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-background/70 text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground"
                    aria-label={t(labelKey)}
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full justify-center sm:w-auto"
              >
                <Link href="/contact">{t("footer.contact")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
