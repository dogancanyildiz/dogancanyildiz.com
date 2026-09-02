import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  name: string;
  tagline: string;
  /** Passed through to the mark; the header blinks, everywhere else stays still. */
  cursor?: "steady" | "blink";
  /**
   * Header mode. Below 480px the row cannot hold the lockup next to the 44px
   * controls (measured with device emulation), so only the mark shows there
   * and a screen reader only copy keeps the name; from 480px up the text
   * block is the visible one. Off by default: the footer has room.
   */
  responsive?: boolean;
  className?: string;
}

/**
 * The owner's logo lockup: mark, hairline, the name over a mono tagline. Mark
 * and tagline are decorative, so a link wrapping this is named by the name
 * alone. No hooks, so it renders in server and client components alike.
 */
export function BrandLockup({
  name,
  tagline,
  cursor = "steady",
  responsive = false,
  className,
}: BrandLockupProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark
        height={24}
        cursor={cursor}
        className="shrink-0 text-foreground"
      />
      {responsive ? (
        <span className="sr-only min-[480px]:hidden">{name}</span>
      ) : null}
      <span
        className={cn(
          "min-w-0 items-center gap-2.5",
          responsive ? "hidden min-[480px]:flex" : "flex"
        )}
      >
        <span
          aria-hidden="true"
          className="h-7 w-px shrink-0 bg-border-strong"
        />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-[15px] leading-none font-medium tracking-tight text-foreground">
            {name}
          </span>
          <span
            aria-hidden="true"
            className="truncate font-mono text-[11px] leading-none tracking-wide text-primary"
          >
            {tagline}
          </span>
        </span>
      </span>
    </span>
  );
}
