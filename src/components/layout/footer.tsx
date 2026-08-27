"use client";

import { Github, Linkedin, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/nav";

const socialLinks = [
  {
    href: "https://github.com/dogancanyildiz",
    labelKey: "footer.github",
    Icon: Github,
  },
  {
    href: "https://www.linkedin.com/in/dogancanyildiz",
    labelKey: "footer.linkedin",
    Icon: Linkedin,
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations();
  const email = t("contact.email");

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
            <p className="font-mono text-xs text-muted-foreground">
              © {year} {t("brand")}. {t("footer.copyright")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <nav
              aria-label={t("footer.navTitle")}
              className="rounded-[1.5rem] border border-border bg-background p-5"
            >
              <p className="mb-3 font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("footer.navTitle")}
              </p>
              <ul className="flex flex-col">
                {navItems.map(({ href, key }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="tap-target flex items-center text-sm text-foreground no-underline transition-colors hover:text-primary"
                    >
                      {t(key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="rounded-[1.5rem] border border-border bg-background p-5">
              <p className="mb-3 font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("footer.emailLabel")}
              </p>
              <a
                href={`mailto:${email}`}
                className="tap-target inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-4" />
                {email}
              </a>
              <p className="mb-3 mt-6 font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("footer.elsewhere")}
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map(({ href, labelKey, Icon }) => (
                  <a
                    key={labelKey}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target flex items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
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
