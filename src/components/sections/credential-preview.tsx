"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { X } from "lucide-react";
import { NewTabHint } from "@/components/ui/new-tab-hint";
import { outboundEvent } from "@/lib/analytics-events";

export interface CredentialPreviewProps {
  /** Official credential name, printed under the enlarged artwork. */
  name: string;
  src: string;
  /** Intrinsic size of the file, which both renders read for their box. */
  width: number;
  height: number;
  /** Alt text for the thumbnail, "{name} badge" or "{name} certificate". */
  alt: string;
  /** Already interpolated: "Enlarge {name}" / "Büyüt: {name}". */
  enlargeLabel: string;
  closeLabel: string;
  verifyUrl?: string;
  /** Visible word on the link, "Verify" / "Doğrula". */
  verifyText?: string;
  /** Accessible name for that link, "Verify {name}" / "Doğrula: {name}". */
  verifyLabel?: string;
  /** The "a11y.opensInNewTab" string, resolved by the caller. */
  newTabHint: string;
}

/**
 * The badge artwork on a certificate row, as a button that opens the same
 * file large enough to read.
 *
 * A 64px emblem is an ornament: the issuer's mark is recognisable but the
 * course name printed inside a CCNA badge, and every word of the Hackviser
 * certificate, are unreadable at that size. The artwork is the one thing on
 * the row a visitor cannot get at any other way, so it becomes the control
 * and the row keeps its "Verify" link as the way out to the issuer.
 *
 * The overlay is the platform's own <dialog>, opened with showModal(). That
 * buys Escape, the inert background, the top layer above every stacking
 * context on the page and the focus trap without a line of key handling here.
 * What the element does not do on its own is what this component adds: the
 * backdrop is not a close button in the spec, and body scrolling still moves
 * behind the modal in every browser.
 *
 * Labels arrive as props rather than through useTranslations. This is the
 * only client component in the certificate section, and reading messages here
 * would pull the whole about namespace into the client bundle to print two
 * aria labels the server already knows.
 */
export function CredentialPreview({
  name,
  src,
  width,
  height,
  alt,
  enlargeLabel,
  closeLabel,
  verifyUrl,
  verifyText,
  verifyLabel,
  newTabHint,
}: CredentialPreviewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => {
    dialogRef.current?.showModal();
    // showModal() is what locks the page: the scrollbar behind a top layer
    // element still responds to the wheel, so the modal would scroll the
    // About page underneath itself.
    document.body.style.overflow = "hidden";
  }, []);

  /**
   * Undo everything open() did. Idempotent, because it runs from both the
   * close event and the calls that close the dialog directly, and either one
   * may be the only one that happens.
   */
  const release = useCallback(() => {
    document.body.style.overflow = "";
    // Browsers restore focus to the invoker themselves, but only when the
    // invoker is still in the document and still focusable. Asking for it
    // explicitly costs nothing and makes the return testable.
    triggerRef.current?.focus();
  }, []);

  /**
   * Chrome drops the close event on the first close() that follows a close by
   * Escape: the dialog shuts, no event is dispatched, and a teardown wired
   * only to onClose never runs. That left the page locked at
   * overflow: hidden with no way back short of a reload, from a sequence as
   * ordinary as open, Escape, open, close. So the lock is released here, next
   * to the close() that earns it, and onClose stays for the Escape path,
   * which does fire.
   */
  const close = useCallback(() => {
    dialogRef.current?.close();
    release();
  }, [release]);

  // A dialog left open when the component unmounts would take the scroll lock
  // with it and leave the page unable to scroll.
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /**
   * The backdrop is painted by ::backdrop, which is not an element and cannot
   * be clicked; a click on it reports the dialog itself as the target. The
   * dialog carries no padding of its own for exactly this reason, so every
   * pixel of it that is not the inner panel is backdrop.
   */
  const handleDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      close();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-label={enlargeLabel}
        // The slot keeps its width whether or not there is artwork, so the
        // names stay aligned down the whole section.
        className="tap-target flex h-16 w-24 shrink-0 cursor-pointer items-center justify-center rounded-md"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          // The row never shows more than 64 CSS px of this file, so the
          // optimizer is asked for that and not for the 600px original.
          sizes="64px"
          // Badges are unframed on purpose: each PNG carries its own
          // silhouette, and a border would draw a box around shapes that are
          // not boxes. The landscape certificate gets the same 64px slot and
          // letterboxes inside it.
          className="h-16 w-auto max-w-full object-contain"
        />
      </button>

      <dialog
        ref={dialogRef}
        onClose={release}
        onClick={handleDialogClick}
        className="credential-dialog"
        aria-label={name}
      >
        <div className="credential-dialog-panel">
          {/* Above the artwork rather than floating over its top right
              corner: the badges are transparent PNGs and the CAPT scan is a
              white page, so an overlaid icon would sit on a different ground
              in every row and in every theme. */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={close}
              aria-label={closeLabel}
              className="tap-target -mr-2 -mt-2 flex cursor-pointer items-center justify-center rounded-md text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <Image
            src={src}
            alt={name}
            width={width}
            height={height}
            sizes="(min-width: 768px) 600px, 90vw"
            className="h-auto w-full object-contain"
          />

          <p className="mt-4 text-sm leading-relaxed">{name}</p>

          {verifyUrl && verifyText ? (
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap-target mt-1 inline-flex items-center text-sm text-primary underline underline-offset-4"
              {...outboundEvent(verifyUrl)}
            >
              {/* The repeated word "Verify"/"Doğrula" is what a sighted
                  reader sees; the accessible name is the sr-only span below,
                  which names the credential the way the row's own link does. */}
              <span aria-hidden="true">{verifyText}</span>
              <span className="sr-only">{verifyLabel ?? verifyText}</span>
              <NewTabHint text={newTabHint} />
            </a>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
