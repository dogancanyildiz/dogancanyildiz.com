"use client";

import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

const socialLinks = [
  { href: "https://github.com", labelKey: "footer.github", Icon: Github },
  { href: "https://linkedin.com", labelKey: "footer.linkedin", Icon: Linkedin },
  { href: "https://twitter.com", labelKey: "footer.twitter", Icon: Twitter },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLocale();

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
        <p className="text-sm text-muted-foreground">
          © {year} {t("brand")}. {t("footer.copyright")}
        </p>
        <div className="flex items-center gap-6">
          {socialLinks.map(({ href, labelKey, Icon }) => (
            <a
              key={labelKey}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t(labelKey)}
            >
              <Icon className="size-5" />
            </a>
          ))}
          <Link
            href="/contact"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("footer.contact")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
