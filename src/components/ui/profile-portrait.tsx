import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProfilePortraitProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * The About page portrait. A 4:5 frame with the hairline border and radius
 * the project covers use, so the photo reads as part of the page rather than
 * as a chat avatar (the small round crop it replaces, 2026-09-08). Sized in
 * fixed steps so the frame never stretches on a wide screen. The source is
 * 864x1080; next/image serves the rendered width from it, and quality sits
 * above the default because a face shows compression long before a
 * screenshot does.
 */
export function ProfilePortrait({ src, alt, className }: ProfilePortraitProps) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] w-60 shrink-0 overflow-hidden rounded-lg border border-border/70 sm:w-64 lg:w-72",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 288px, (min-width: 640px) 256px, 240px"
        quality={90}
        priority
        className="object-cover"
      />
    </div>
  );
}
