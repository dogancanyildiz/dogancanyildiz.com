"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { isNavItemActive, navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="tap-target md:hidden"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="size-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 top-16 z-50 border-b border-border bg-background p-4 outline-none"
        >
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {t("nav.menu")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="tap-target"
                aria-label={t("nav.closeMenu")}
              >
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>
          <ul className="mt-4 flex flex-col">
            {navItems.map(({ href, key }) => {
              const isActive = isNavItemActive(pathname, href);
              return (
                <li
                  key={href}
                  className="border-b border-border last:border-b-0"
                >
                  <Dialog.Close asChild>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "tap-target flex items-center py-3 text-lg no-underline transition-colors",
                        isActive
                          ? "font-medium text-foreground"
                          : "text-foreground/80 hover:text-foreground"
                      )}
                    >
                      {t(key)}
                    </Link>
                  </Dialog.Close>
                </li>
              );
            })}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
