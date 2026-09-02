/**
 * Descriptor for the generated OpenGraph image.
 *
 * The image itself comes from the src/app/[lang]/opengraph-image.tsx file
 * convention, which attaches it to the [lang] segment. Next merges metadata
 * shallowly and replaces openGraph wholesale, so a page below that segment
 * that returns its own openGraph loses the inherited image and has to name it
 * again. Both sides read the id and the size from here so they cannot drift.
 */
export const OG_IMAGE_ID = "default";
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

/**
 * Locale relative path of the rendered image, to be passed through localeUrl.
 * It mirrors the route Next generates for the file convention:
 * /[lang]/opengraph-image/[__metadata_id__].
 */
export const OG_IMAGE_PATH = `/opengraph-image/${OG_IMAGE_ID}`;

/**
 * Same path for a page that has an opengraph-image.tsx of its own.
 *
 * The file convention hangs the image off the segment it sits in, so the card
 * for /blog/foo is served from /blog/foo/opengraph-image/default. A page that
 * ships one has to name it here as well, for the reason in the block above:
 * its openGraph object replaces the inherited one, image included, so
 * returning metadata without this would leave the page advertising the
 * identity card while its own image sat unreferenced.
 */
export function ogImagePathFor(pagePath: string): string {
  const base = pagePath === "/" ? "" : pagePath.replace(/\/+$/, "");
  return `${base}${OG_IMAGE_PATH}`;
}
