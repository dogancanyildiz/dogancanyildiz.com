import { cn } from "@/lib/utils";

interface ContentEntryIndexProps {
  index: number;
  className?: string;
}

/** Zero-padded row index shared by project, post and experience lists. */
export function ContentEntryIndex({
  index,
  className,
}: ContentEntryIndexProps) {
  return (
    <span className={cn("content-index", className)} aria-hidden="true">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

interface ContentEntryBodyProps {
  children: React.ReactNode;
  className?: string;
}

/** Main column inside a content-entry row. */
export function ContentEntryBody({
  children,
  className,
}: ContentEntryBodyProps) {
  return <div className={cn("min-w-0 space-y-3", className)}>{children}</div>;
}
