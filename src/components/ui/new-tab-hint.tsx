interface NewTabHintProps {
  /** The resolved "a11y.opensInNewTab" string, in the caller's own locale. */
  text: string;
}

/**
 * Screen-reader-only text dropped inside every link that opens in a new tab
 * (`target="_blank"`), the fix for audit item R3-19: without it, a screen
 * reader gives no warning before leaving the page.
 *
 * A visually hidden child of the link, not an `aria-label` on it: an
 * `aria-label` replaces the link's own accessible name outright, so a link
 * that already reads "View live" would instead read only "opens in a new
 * tab" and lose the word a sighted user sees. As a child it only extends the
 * name the link already has.
 *
 * The text arrives as a prop rather than through its own useTranslations
 * call: this renders inside both Server and Client Components, some of them
 * exercised in unit tests that resolve an async Server Component by calling
 * it directly (tests/helpers/render.ts's resolveServerTree) rather than
 * through Next's real RSC pipeline, which is the only place next-intl's
 * client hook can read a request-scoped locale with no
 * `NextIntlClientProvider` in the tree. A caller that already resolved its
 * own labels the normal way (`getTranslations`/`useTranslations`) resolves
 * this one string the same way, so nothing here depends on which pipeline
 * rendered its parent.
 */
export function NewTabHint({ text }: NewTabHintProps) {
  return <span className="sr-only">{text}</span>;
}
