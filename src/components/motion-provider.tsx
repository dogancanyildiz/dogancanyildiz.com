"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "motion/react";

/**
 * domAnimation covers animation, variants, exit and the tap/hover/focus
 * gestures. Layout animations and drag live in domMax and are deliberately not
 * loaded: nothing in this site needs them.
 *
 * The feature bundle is loaded lazily, so the routes that animate nothing (the
 * home page and every listing, since those sections render on the server) never
 * pay for it during the initial load.
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
