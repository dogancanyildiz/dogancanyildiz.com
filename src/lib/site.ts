import type { AppLocale } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

/**
 * Social links shown in the UI. Derived from the same array the Person
 * JSON-LD publishes, so schema.org sameAs and the visible footer links can
 * never drift apart. site-config.ts stays the single source of the identity.
 */
function findSocial(host: string): string {
  const match = siteConfig.person.sameAs.find((url) => url.includes(host));
  if (!match) {
    throw new Error(`siteConfig.person.sameAs is missing a ${host} entry`);
  }
  return match;
}

export const SOCIAL = {
  github: findSocial("github.com"),
  linkedin: findSocial("linkedin.com"),
};

export type SocialProfileId =
  | "linkedin"
  | "github"
  | "medium"
  | "youtube"
  | "x"
  | "instagram"
  | "threads"
  | "tiktok";

/**
 * Three groups, in the order the About page shows them: where the work is
 * (professional), where it is written up and talked through (content), and
 * where the day-to-day lives (social). Labels are translated in messages
 * under about.profileGroup*.
 */
export type SocialProfileGroup = "professional" | "content" | "social";

export interface SocialProfile {
  id: SocialProfileId;
  /** Brand name as the network writes it; never translated. */
  label: string;
  url: string;
  group: SocialProfileGroup;
}

/**
 * The networks the About page lists, in display order (owner's order,
 * 2026-09-08). Each row is matched against sameAs by host, so a profile
 * appears the moment its url is added to site-config.ts and disappears when
 * it is removed: the visible list and the Person node's sameAs cannot
 * disagree. Credly stays in sameAs (it is an identity url for the credential
 * graph) but is not a profile to follow, so it has no row here.
 */
const PROFILE_HOSTS: ReadonlyArray<{
  id: SocialProfileId;
  label: string;
  host: string;
  group: SocialProfileGroup;
}> = [
  {
    id: "linkedin",
    label: "LinkedIn",
    host: "linkedin.com",
    group: "professional",
  },
  { id: "github", label: "GitHub", host: "github.com", group: "professional" },
  { id: "medium", label: "Medium", host: "medium.com", group: "content" },
  { id: "youtube", label: "YouTube", host: "youtube.com", group: "content" },
  { id: "x", label: "X", host: "x.com", group: "social" },
  {
    id: "instagram",
    label: "Instagram",
    host: "instagram.com",
    group: "social",
  },
  { id: "threads", label: "Threads", host: "threads.com", group: "social" },
  { id: "tiktok", label: "TikTok", host: "tiktok.com", group: "social" },
];

export const SOCIAL_PROFILE_GROUPS: readonly SocialProfileGroup[] = [
  "professional",
  "content",
  "social",
];

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export const SOCIAL_PROFILES: readonly SocialProfile[] = PROFILE_HOSTS.flatMap(
  ({ id, label, host, group }) => {
    const url = siteConfig.person.sameAs.find((u) => hostOf(u) === host);
    return url ? [{ id, label, url, group }] : [];
  }
);

export const CONTACT_EMAIL_PUBLIC = "me@dogancanyildiz.com";

/**
 * International number with no plus or spaces, the form wa.me expects.
 * Kept off Person JSON-LD on purpose: the chat link is a contact path, not a
 * public identity URL, and the digits stay out of the structured data.
 */
export const WHATSAPP_NUMBER = "905318739400";

export function whatsappHref(prefilledText: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(prefilledText)}`;
}

/**
 * Public paths of the CV, one PDF per locale. They live here rather than in
 * lib/cv.ts so a client component can read a path without pulling node:fs
 * into the browser bundle. The file names carry the language on purpose: a
 * search result for "dogancanyildiz cv" should say which edition it is
 * before the click, and the two must never share a URL.
 */
export const CV_PATHS = {
  tr: "/cv/dogancanyildiz-cv-tr.pdf",
  en: "/cv/dogancanyildiz-cv-en.pdf",
} as const satisfies Record<AppLocale, string>;

/**
 * The single English PDF the site served before the Turkish edition arrived
 * (2026-09-08). Redirected permanently to the English file in next.config.ts
 * so an old bookmark or search listing still lands on a CV.
 */
export const LEGACY_CV_PATH = "/cv/dogancanyildiz-cv.pdf";

/** Public path stem for the optional profile photo (see lib/profile-image.ts). */
export const PROFILE_IMAGE_PATH = siteConfig.person.profileImagePath;
