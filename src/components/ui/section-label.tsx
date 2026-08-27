import { cn } from "@/lib/utils";

interface SectionLabelProps {
  title: string;
  index: string;
  className?: string;
}

export function SectionLabel({ title, index, className }: SectionLabelProps) {
  return (
    <p className={cn("section-label", className)}>
      {title} · {index}
    </p>
  );
}
