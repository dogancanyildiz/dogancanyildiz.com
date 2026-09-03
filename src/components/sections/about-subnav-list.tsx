import { PageSubnavList } from "@/components/ui/page-subnav-list";

// The scroll-spied sticky nav is a page-level primitive shared with Services
// (see src/components/ui/page-subnav-list.tsx); this re-export keeps the
// established import path and the AboutSubnavList name for callers and
// tests that still reach for it under About.
export const AboutSubnavList = PageSubnavList;
