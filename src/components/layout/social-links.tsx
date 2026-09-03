import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icon";
import { outboundEvent } from "@/lib/analytics-events";
import { SOCIAL } from "@/lib/site";

const ICON_LINK_CLASS =
  "tap-target inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground";

interface SocialLinksProps {
  githubLabel: string;
  linkedinLabel: string;
}

/**
 * The two profile links that belong next to the name in the header. Footer
 * elsewhere is labelled text, so it does not reuse this; the marks would
 * float again.
 */
export function SocialLinks({ githubLabel, linkedinLabel }: SocialLinksProps) {
  return (
    <div className="flex items-center">
      <a
        href={SOCIAL.github}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={githubLabel}
        className={ICON_LINK_CLASS}
        {...outboundEvent(SOCIAL.github)}
      >
        <GithubIcon className="size-4" />
      </a>
      <a
        href={SOCIAL.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={linkedinLabel}
        className={ICON_LINK_CLASS}
        {...outboundEvent(SOCIAL.linkedin)}
      >
        <LinkedinIcon className="size-4" />
      </a>
    </div>
  );
}
