/**
 * Where the language switcher should point when the current page has no
 * translation in the target locale.
 *
 * A project or post detail page that only exists in one locale would 404 if
 * the switcher linked straight to it in the other locale, so it falls back
 * to the section root instead (/blog, /projects). Any other untranslated
 * path falls back to the app root. A translated path is returned unchanged.
 */
export function switchTargetPath(
  pathname: string,
  untranslated: readonly string[]
): string {
  if (!untranslated.includes(pathname)) return pathname;
  if (pathname.startsWith("/blog/")) return "/blog";
  if (pathname.startsWith("/projects/")) return "/projects";
  return "/";
}
