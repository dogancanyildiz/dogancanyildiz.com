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

export const CONTACT_EMAIL_PUBLIC = "me@dogancanyildiz.com";

/**
 * Public path to the CV file. Lives here rather than in lib/cv.ts because
 * client components (e.g. the hero) need to read the path without pulling
 * node:fs into the browser bundle.
 */
export const CV_PATH = "/cv/dogancanyildiz-cv.pdf";
