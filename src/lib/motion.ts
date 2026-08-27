import type { Variants } from "motion/react";

/** 40ms per item, capped at four items: 03-tasarim-ui-ux.md motion budget. */
export const STAGGER_SECONDS = 0.04;
export const MAX_STAGGER_ITEMS = 4;
const DURATION_SECONDS = 0.18;

export function staggerDelay(index: number): number {
  const clamped = Math.min(Math.max(index, 0), MAX_STAGGER_ITEMS - 1);
  return clamped * STAGGER_SECONDS;
}

/** List variant: pass the item index through the `custom` prop. */
export function fadeUp(reduced: boolean): Variants {
  return {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 },
    show: (index: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0 : DURATION_SECONDS,
        delay: reduced ? 0 : staggerDelay(index),
        ease: "easeOut",
      },
    }),
  };
}

/** Parent variant for a group whose children animate in sequence. */
export function staggerContainer(reduced: boolean): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : STAGGER_SECONDS } },
  };
}

/** Child variant used together with staggerContainer. */
export function staggerItem(reduced: boolean): Variants {
  return {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : DURATION_SECONDS, ease: "easeOut" },
    },
  };
}
