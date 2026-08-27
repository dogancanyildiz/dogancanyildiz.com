import { cn } from "@/lib/utils";

interface ContentPanelProps {
  children: React.ReactNode;
  className?: string;
}

/** Semantic content grouping — spacing only, no card chrome. */
export function ContentPanel({ children, className }: ContentPanelProps) {
  return <div className={cn("space-y-6", className)}>{children}</div>;
}

interface InsetPanelProps {
  children: React.ReactNode;
  className?: string;
}

/** Nested block within a section — spacing only. */
export function InsetPanel({ children, className }: InsetPanelProps) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}
