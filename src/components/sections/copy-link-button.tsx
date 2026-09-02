"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * How long the button keeps the outcome on screen before it goes back to
 * offering the copy again.
 */
const RESET_MS = 2000;

type CopyState = "idle" | "copied" | "failed";

interface CopyLinkButtonProps {
  /** Absolute url to put on the clipboard. */
  url: string;
  /** Idle label, and the accessible name of the control. */
  label: string;
  /** Shown for RESET_MS once the write went through. */
  copiedLabel: string;
  /** Shown for RESET_MS when there is no clipboard, or it refused. */
  failedLabel: string;
  className?: string;
}

/**
 * The one interactive part of the share block.
 *
 * Every label arrives as a prop rather than through useTranslations: adding a
 * namespace to the client catalog would ship these nine strings to every page
 * in the shell for a button that exists on two routes (see
 * CLIENT_MESSAGE_NAMESPACES in src/app/[lang]/layout.tsx, locked by
 * tests/perf/client-payload.test.ts).
 */
export function CopyLinkButton({
  url,
  label,
  copiedLabel,
  failedLabel,
  className,
}: CopyLinkButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      // navigator.clipboard is undefined on an insecure origin, and the write
      // itself can be refused by permission or by a browser that wants a
      // closer user gesture. Both land here, and both get the same answer.
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    // The failure message expires with the success one on purpose. It is not
    // the recovery path: the url sits next to this button as selectable text
    // whatever the clipboard did, so leaving the red line up forever would
    // only keep an error on screen after the reader has already worked around
    // it.
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), RESET_MS);
  }

  // onClick is typed as returning void, so the async function is started from
  // a synchronous handler rather than handed over directly. Nothing is
  // chained onto it: copy() reports both outcomes itself and throws neither.
  function handleClick() {
    void copy();
  }

  const message =
    state === "copied" ? copiedLabel : state === "failed" ? failedLabel : null;

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        {state === "copied" ? (
          <Check className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Copy className="size-4 shrink-0" aria-hidden="true" />
        )}
        {message ?? label}
      </button>
      {/* The button's own text carries the outcome visually, but a label
          swapping under the cursor is not an announcement: assistive tech
          reads a control's name when focus reaches it, not when it changes.
          The live region is what actually says it out loud. */}
      <span role="status" aria-live="polite" className="sr-only">
        {message ?? ""}
      </span>
    </>
  );
}
