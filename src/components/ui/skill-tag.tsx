import { cn } from "@/lib/utils";
import { skillIconFor, type TechIconData } from "@/lib/tech-icons";

interface TechIconProps {
  icon: TechIconData;
  className?: string;
}

/** aria-hidden, so it carries no img role: the label beside it is the name. */
export function TechIcon({ icon, className }: TechIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-3.5 shrink-0", className)}
    >
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );
}

interface SkillTagProps {
  label: string;
  className?: string;
}

export function SkillTag({ label, className }: SkillTagProps) {
  const icon = skillIconFor(label);

  return (
    <span
      className={cn(
        "tag-pill normal-case tracking-normal",
        icon && "inline-flex items-center gap-1.5",
        className
      )}
    >
      {icon ? <TechIcon icon={icon} /> : null}
      {label}
    </span>
  );
}
