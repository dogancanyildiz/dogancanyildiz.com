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
import { SOCIAL, SOCIAL_PROFILES, type SocialProfileId } from "@/lib/site";

const ICON_LINK_CLASS =
  "tap-target inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground";

export const PROFILE_ICONS: Record<
  SocialProfileId,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  linkedin: LinkedinIcon,
  github: GithubIcon,
  medium: MediumIcon,
  youtube: YoutubeIcon,
  x: XIcon,
  instagram: InstagramIcon,
  threads: ThreadsIcon,
  tiktok: TiktokIcon,
};

interface SocialLinksProps {
  githubLabel: string;
  linkedinLabel: string;
  /** The "a11y.opensInNewTab" string, resolved by the caller. */
  newTabHint: string;
  /**
   * "primary": GitHub and LinkedIn only, the two marks that fit beside the
   * name in the header. "all": every profile in SOCIAL_PROFILES, for the
   * mobile menu where a full row has room. The footer spells the same set
   * out as text.
   */
  profiles?: "primary" | "all";
}

/**
 * Icon-only profile links. The mark is aria-hidden, so a visually hidden
 * span carries the accessible name instead of an aria-label: identical
 * result, but it stays extendable. NewTabHint extends it with the R3-19
 * "opens in a new tab" hint. rel="me" ties each profile to this site for
 * the crawlers that read it (IndieAuth style identity, Mastodon
 * verification); the Person node's sameAs carries the same list.
 */
export function SocialLinks({
  githubLabel,
  linkedinLabel,
  newTabHint,
  profiles = "primary",
}: SocialLinksProps) {
  const rows =
    profiles === "all"
      ? SOCIAL_PROFILES.map((p) => ({ id: p.id, url: p.url, label: p.label }))
      : [
          { id: "github" as const, url: SOCIAL.github, label: githubLabel },
          {
            id: "linkedin" as const,
            url: SOCIAL.linkedin,
            label: linkedinLabel,
          },
        ];

  return (
    <div className="flex flex-wrap items-center">
      {rows.map(({ id, url, label }) => {
        const Icon = PROFILE_ICONS[id];
        return (
          <a
            key={id}
            href={url}
            target="_blank"
            rel="me noopener noreferrer"
            className={ICON_LINK_CLASS}
            {...outboundEvent(url)}
          >
            <Icon className="size-4" />
            <span className="sr-only">{label}</span>
            <NewTabHint text={newTabHint} />
          </a>
        );
      })}
    </div>
  );
}
