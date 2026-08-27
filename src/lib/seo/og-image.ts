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
