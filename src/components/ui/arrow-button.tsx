import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ArrowButtonProps {
  href: string;
  variant?: "primary" | "ghost";
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

function isInternal(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

const styles = {
  base: "group inline-flex items-center gap-3.5 rounded-full px-6 py-4 text-sm font-medium transition-colors no-underline",
  primary:
    "bg-foreground text-background hover:bg-transparent hover:text-foreground hover:ring-1 hover:ring-border",
  ghost: "border border-border text-foreground hover:bg-muted/50",
  arrowPrimary:
    "bg-background text-foreground group-hover:bg-foreground group-hover:text-background",
  arrowGhost: "bg-foreground text-background",
};

export function ArrowButton({
  href,
  variant = "primary",
  className,
  children,
  target,
  rel,
}: ArrowButtonProps) {
  const classes = cn(
    styles.base,
    variant === "primary" ? styles.primary : styles.ghost,
    className
  );

  const arrow = (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full transition-transform group-hover:-rotate-45",
        variant === "primary" ? styles.arrowPrimary : styles.arrowGhost
      )}
      aria-hidden="true"
    >
      <ArrowUpRight className="size-3.5" />
    </span>
  );

  if (isInternal(href)) {
    return (
      <Link href={href} className={classes}>
        {children}
        {arrow}
      </Link>
    );
  }

  return (
    <a href={href} className={classes} target={target} rel={rel}>
      {children}
      {arrow}
    </a>
  );
}
