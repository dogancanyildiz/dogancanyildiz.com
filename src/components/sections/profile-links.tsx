import type { ComponentType, SVGProps } from "react";
import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  MediumIcon,
  ThreadsIcon,
  TiktokIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/ui/brand-icon";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { outboundEvent } from "@/lib/analytics-events";
import {
  SOCIAL_PROFILE_GROUPS,
  SOCIAL_PROFILES,
  type SocialProfileGroup,
  type SocialProfileId,
} from "@/lib/site";

const ICONS: Record<SocialProfileId, ComponentType<SVGProps<SVGSVGElement>>> = {
  linkedin: LinkedinIcon,
  github: GithubIcon,
  medium: MediumIcon,
  youtube: YoutubeIcon,
  x: XIcon,
  instagram: InstagramIcon,
  threads: ThreadsIcon,
  tiktok: TiktokIcon,
};

const PILL_CLASS =
  "tag-pill inline-flex min-h-7 items-center gap-1.5 normal-case tracking-normal text-foreground transition-colors hover:border-primary/40 hover:text-primary";

interface ProfileLinksProps {
  /** Accessible name of the whole block, e.g. "Profiller". */
  label: string;
  /** Translated group headings, keyed by group. */
  groupLabels: Record<SocialProfileGroup, string>;
  /** The "a11y.opensInNewTab" string, resolved by the caller. */
  newTabHint: string;
}

/**
 * Every public profile as a labelled pill, grouped under a meta-label the
 * way the "now / location" strip below is: professional, content, social.
 * The header keeps its two icon-only marks (GitHub, LinkedIn); here the
 * whole set is spelled out because a visitor on this page is deciding
 * whether to follow, and a bare glyph for Threads or TikTok is not a name.
 * Data comes from SOCIAL_PROFILES, derived from the Person node's sameAs,
 * so the list can never drift from the structured data; a group with no
 * profile on disk is simply not rendered.
 */
export function ProfileLinks({
  label,
  groupLabels,
  newTabHint,
}: ProfileLinksProps) {
  const groups = SOCIAL_PROFILE_GROUPS.map((group) => ({
    group,
    profiles: SOCIAL_PROFILES.filter((p) => p.group === group),
  })).filter((g) => g.profiles.length > 0);
  if (groups.length === 0) return null;

  return (
    <nav aria-label={label} className="flex flex-wrap gap-x-8 gap-y-4">
      {groups.map(({ group, profiles }) => (
        <div key={group} className="space-y-2">
          <p className="meta-label">{groupLabels[group]}</p>
          <ul className="flex flex-wrap gap-2">
            {profiles.map((profile) => {
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
        </div>
      ))}
    </nav>
  );
}
