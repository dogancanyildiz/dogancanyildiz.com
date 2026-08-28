"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AboutSubnavItem {
  id: string;
  label: string;
}

interface AboutSubnavListProps {
  items: AboutSubnavItem[];
  ariaLabel: string;
}

// Header (h-16) plus this nav's own sticky height (padding + a 44px tap
// target) land around 124px; the top margin below clears that stack before a
// section counts as "current". See scroll-mt-32 on the section ids in
// about/page.tsx, which keeps the anchor jump landing past the same stack.
const OBSERVER_ROOT_MARGIN = "-140px 0px -60% 0px";

export function AboutSubnavList({ items, ariaLabel }: AboutSubnavListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: OBSERVER_ROOT_MARGIN, threshold: 0 }
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label={ariaLabel}
      className="sticky top-16 z-30 -mx-4 border-b border-border bg-background/85 backdrop-blur-md sm:-mx-6"
    >
      <div className="relative">
        {/* Edge fade so a scrollable strip signals there is more to either
            side, instead of clipping the last pill outright. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent sm:left-2"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent sm:right-2"
        />
        <div className="overflow-x-auto px-4 py-2 sm:px-6">
          <ul className="flex min-w-max gap-1">
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "tap-target inline-flex items-center rounded-full px-3 py-1.5 text-sm no-underline transition-colors",
                      isActive
                        ? "bg-accent/60 text-foreground"
                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
