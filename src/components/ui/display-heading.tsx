import { cn } from "@/lib/utils";

type DisplaySize = "hero" | "section" | "lead" | "cta";

interface DisplayHeadingProps {
  as?: "h1" | "h2" | "h3" | "p";
  size: DisplaySize;
  children: React.ReactNode;
  className?: string;
  accent?: React.ReactNode;
}

const sizeClass: Record<DisplaySize, string> = {
  hero: "display-hero",
  section: "display-section",
  lead: "display-lead",
  cta: "display-cta",
};

export function DisplayHeading({
  as: Tag = "h2",
  size,
  children,
  className,
  accent,
}: DisplayHeadingProps) {
  return (
    <Tag className={cn(sizeClass[size], className)}>
      {children}
      {accent ? (
        <>
          <br />
          <span className="text-muted-foreground">{accent}</span>
        </>
      ) : null}
    </Tag>
  );
}
