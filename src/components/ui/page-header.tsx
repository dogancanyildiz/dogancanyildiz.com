import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  /** Id placed on the heading element so a landmark can point at it via aria-labelledby. */
  titleId?: string;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
  /** h1 when the heading opens the page, h2 (default) for a section. */
  as?: "h1" | "h2";
}

export function PageHeader({
  eyebrow,
  title,
  titleId,
  description,
  align = "left",
  action,
  className,
  as: Tag = "h2",
}: PageHeaderProps) {
  const centered = align === "center";
  const titleClass = Tag === "h1" ? "page-title" : "section-heading";

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        centered && "items-center text-center",
        className
      )}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <div
        className={cn(
          "flex flex-wrap items-baseline justify-between gap-4",
          centered && "mx-auto w-full flex-col items-center"
        )}
      >
        <div className={cn("max-w-4xl space-y-3", centered && "mx-auto")}>
          <Tag id={titleId} className={titleClass}>
            {title}
          </Tag>
          {description ? <p className="section-copy">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
