interface ScrollIndicatorProps {
  label: string;
}

export function ScrollIndicator({ label }: ScrollIndicatorProps) {
  return (
    <p className="mt-16 hidden items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-muted-foreground sm:flex">
      <span className="h-px w-8 bg-muted-foreground/60" aria-hidden="true" />
      {label}
    </p>
  );
}
