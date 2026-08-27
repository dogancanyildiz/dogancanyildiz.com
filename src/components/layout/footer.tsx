"use client";

import { Github, Linkedin, Mail, Rss } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { navItems } from "@/lib/nav";
import { CONTACT_EMAIL_PUBLIC, SOCIAL } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations();
  const tBrand = useTranslations("brand");

  return (
    <footer className="pb-6 pt-4 sm:pb-8">
      <div className="page-shell">
        <div className="surface-panel grid gap-8 px-6 py-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-8">
          <div className="space-y-4">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-3xl sm:text-4xl">{tBrand("name")}</h2>
              <p className="section-copy">{t("footer.tagline")}</p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              © {year} {tBrand("name")}. {t("footer.copyright")}
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
                href={`mailto:${CONTACT_EMAIL_PUBLIC}`}
                className="tap-target inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-4" aria-hidden="true" />
                {CONTACT_EMAIL_PUBLIC}
              </a>
              <p className="mb-3 mt-6 font-mono text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("footer.elsewhereLabel")}
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={SOCIAL.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("footer.github")}
                  className="tap-target flex items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Github className="size-4" aria-hidden="true" />
                </a>
                <a
                  href={SOCIAL.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("footer.linkedin")}
                  className="tap-target flex items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Linkedin className="size-4" aria-hidden="true" />
                </a>
                <Link
                  href="/feed.xml"
                  prefetch={false}
                  aria-label={t("footer.rss")}
                  className="tap-target flex items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Rss className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
