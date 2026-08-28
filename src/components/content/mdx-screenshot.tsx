import Image from "next/image";
import { cn } from "@/lib/utils";

interface ScreenshotProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * MDX shortcode for case study screenshots. Paths are public URLs or Velite
 * asset paths under /static/.
 */
export function Screenshot({
  src,
  alt,
  caption,
  width = 1200,
  height = 750,
  className,
}: ScreenshotProps) {
  return (
    <figure className={cn("not-prose my-8 space-y-2", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 1024px) 66rem, 100vw"
        className="w-full rounded-lg border border-border/70 object-cover"
      />
      {caption ? (
        <figcaption className="text-sm leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
