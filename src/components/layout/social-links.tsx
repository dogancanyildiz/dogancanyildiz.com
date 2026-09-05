import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icon";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { outboundEvent } from "@/lib/analytics-events";
import { SOCIAL } from "@/lib/site";

const ICON_LINK_CLASS =
  "tap-target inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground";

interface SocialLinksProps {
  githubLabel: string;
  linkedinLabel: string;
  /** The "a11y.opensInNewTab" string, resolved by the caller. */
  newTabHint: string;
}

/**
 * The two profile links that belong next to the name in the header. Footer
 * elsewhere is labelled text, so it does not reuse this; the marks would
 * float again.
 *
 * The mark is aria-hidden, so a visually hidden span carries the accessible
 * name instead of an aria-label: identical result, but it stays extendable.
 * NewTabHint extends it with the R3-19 "opens in a new tab" hint.
 */
export function SocialLinks({
  githubLabel,
  linkedinLabel,
  newTabHint,
}: SocialLinksProps) {
  return (
    <div className="flex items-center">
      <a
        href={SOCIAL.github}
        target="_blank"
        rel="noopener noreferrer"
        className={ICON_LINK_CLASS}
        {...outboundEvent(SOCIAL.github)}
      >
        <GithubIcon className="size-4" />
        <span className="sr-only">{githubLabel}</span>
        <NewTabHint text={newTabHint} />
      </a>
      <a
        href={SOCIAL.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className={ICON_LINK_CLASS}
        {...outboundEvent(SOCIAL.linkedin)}
      >
        <LinkedinIcon className="size-4" />
        <span className="sr-only">{linkedinLabel}</span>
        <NewTabHint text={newTabHint} />
      </a>
    </div>
  );
}
