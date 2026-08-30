import type { SVGProps } from "react";
import { siGithub, siWhatsapp } from "simple-icons";
import { cn } from "@/lib/utils";

/**
 * LinkedIn's mark was pulled from the simple-icons package after a trademark
 * takedown request, so the glyph is kept here directly (same 24x24 path the
 * package used to ship) instead of importing it.
 */
const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

/**
 * The full SVG surface is part of the type. Callers were already passing
 * aria-hidden and TypeScript waved it through only because JSX exempts
 * hyphenated attribute names: the prop was dropped on the floor, and a typo in
 * one would have gone unnoticed the same way. aria-hidden stays the default
 * (every caller labels the control around the mark) but is now overridable.
 *
 * The geometry is not. SVGAttributes declares both `path` and `viewBox`, so
 * spreading the caller's props over the element would otherwise let a caller
 * swap the brand mark for an arbitrary outline; both are dropped from the
 * public props and written after the spread.
 */
type BrandIconProps = Omit<SVGProps<SVGSVGElement>, "path" | "viewBox">;

/**
 * Renders a brand mark as an inline `currentColor` SVG, sized and colored
 * like a UI icon (not a colored tech-stack pill, see tech-icons.ts for that).
 * Used in place of lucide-react's Github/Linkedin icons, which lucide 1.0
 * removed. The mark carries no img role: it says nothing an aria-hidden
 * element can use, and it would only mislead if a caller ever turns aria-hidden
 * off without adding a name.
 */
function BrandIcon({
  path,
  className,
  ...props
}: BrandIconProps & { path: string }) {
  return (
    <svg
      aria-hidden="true"
      {...props}
      viewBox="0 0 24 24"
      className={cn("size-4", className)}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}

export function GithubIcon(props: BrandIconProps) {
  return <BrandIcon path={siGithub.path} {...props} />;
}

export function LinkedinIcon(props: BrandIconProps) {
  return <BrandIcon path={LINKEDIN_PATH} {...props} />;
}

export function WhatsAppIcon(props: BrandIconProps) {
  return <BrandIcon path={siWhatsapp.path} {...props} />;
}
