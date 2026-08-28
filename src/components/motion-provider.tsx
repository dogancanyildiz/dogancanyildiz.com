"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "motion/react";

/**
 * domAnimation covers animation, variants, exit and the tap/hover/focus
 * gestures. Layout animations and drag live in domMax and are deliberately not
 * loaded: nothing in this site needs them.
 *
 * The feature bundle is a separate chunk now, so it is off the initial script
 * set on every route. It is not free: LazyMotion requests it from a mount
 * effect, and this provider still wraps the whole tree in the root layout, so
 * every route still fetches it right after hydration. Moving the provider down
 * to the one boundary that still animates (the contact page) belongs to
 * whoever owns that layout, see docs handoff.
 */
const loadDomAnimation = () =>
  import("motion/react").then((mod) => mod.domAnimation);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadDomAnimation} strict>
      {children}
    </LazyMotion>
  );
}
