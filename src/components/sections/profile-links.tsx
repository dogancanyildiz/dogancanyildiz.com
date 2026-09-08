import type { ComponentType, SVGProps } from "react";
import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  ThreadsIcon,
  TiktokIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/ui/brand-icon";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { outboundEvent } from "@/lib/analytics-events";
import { SOCIAL_PROFILES, type SocialProfileId } from "@/lib/site";

const ICONS: Record<SocialProfileId, ComponentType<SVGProps<SVGSVGElement>>> = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  x: XIcon,
  instagram: InstagramIcon,
  threads: ThreadsIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
};

const PILL_CLASS =
  "tag-pill inline-flex min-h-7 items-center gap-1.5 normal-case tracking-normal text-foreground transition-colors hover:border-primary/40 hover:text-primary";

interface ProfileLinksProps {
  /** Accessible name of the list, e.g. "Profiller". */
  label: string;
  /** The "a11y.opensInNewTab" string, resolved by the caller. */
  newTabHint: string;
}

/**
 * Every public profile as a labelled pill, on the About page under the lead.
 * The header keeps its two icon-only marks (GitHub, LinkedIn); here the
 * whole set is spelled out because a visitor on this page is deciding
 * whether to follow, and a bare glyph for Threads or TikTok is not a name.
 * Data comes from SOCIAL_PROFILES, which is derived from the Person node's
 * sameAs, so the list can never drift from the structured data.
 */
export function ProfileLinks({ label, newTabHint }: ProfileLinksProps) {
  if (SOCIAL_PROFILES.length === 0) return null;
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {SOCIAL_PROFILES.map((profile) => {
          const Icon = ICONS[profile.id];
          return (
            <li key={profile.id}>
              <a
                href={profile.url}
                target="_blank"
                rel="me noopener noreferrer"
                className={PILL_CLASS}
                {...outboundEvent(profile.url)}
              >
                <Icon className="size-3.5" />
                {profile.label}
                <NewTabHint text={newTabHint} />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
