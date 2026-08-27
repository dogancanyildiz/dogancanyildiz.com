import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
  /** h1 when the heading opens the page, h2 (default) for a section. */
  as?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        centered && "items-center text-center",
        className
      )}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <div className={cn("max-w-3xl space-y-3", centered && "mx-auto")}>
        <Tag className="section-title">{title}</Tag>
        {description ? <p className="section-copy">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
