import { cn } from "@/lib/utils";

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  as?: "section" | "article" | "div";
}

/** Shared vertical rhythm for routed pages: section padding + max-width shell. */
export function PageSection({
  children,
  className,
  innerClassName = "space-y-8",
  as: Tag = "section",
}: PageSectionProps) {
  return (
    <Tag className={cn("section-space", className)}>
      <div className={cn("page-shell", innerClassName)}>{children}</div>
    </Tag>
  );
}
