"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "motion/react";

/**
 * domAnimation covers animation, variants, exit and the tap/hover/focus
 * gestures. Layout animations and drag live in domMax and are deliberately not
 * loaded: nothing in this site needs them.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
