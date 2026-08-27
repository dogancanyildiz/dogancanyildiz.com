import { cn } from "@/lib/utils";
import { DisplayHeading } from "@/components/ui/display-heading";
import { SectionLabel } from "@/components/ui/section-label";

interface PageHeaderProps {
  label?: string;
  labelIndex?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: React.ReactNode;
  className?: string;
  display?: boolean;
  /** h1 when the heading opens the page, h2 (default) for a section. */
  as?: "h1" | "h2";
}

export function PageHeader({
  label,
  labelIndex,
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  display = false,
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
      {label && labelIndex ? (
        <SectionLabel title={label} index={labelIndex} />
      ) : null}
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <div
        className={cn(
          "flex flex-wrap items-baseline justify-between gap-4",
          centered && "mx-auto w-full flex-col items-center"
        )}
      >
        <div className={cn("max-w-4xl space-y-3", centered && "mx-auto")}>
          {display ? (
            <DisplayHeading as={Tag} size="section">
              {title}
            </DisplayHeading>
          ) : (
            <Tag className={titleClass}>{title}</Tag>
          )}
          {description ? <p className="section-copy">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

/** @deprecated Use PageHeader */
export { PageHeader as SectionHeading };
