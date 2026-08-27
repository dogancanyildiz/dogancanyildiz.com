export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  summary?: string;
  highlight?: string;
  impact?: string;
  role?: string;
  githubUrl?: string;
  liveUrl?: string;
  tags: string[];
  year?: string;
}

export const projects: Project[] = [
  {
    id: "1",
    slug: "ecommerce-platform",
    title: "E‑commerce platform",
    description: "",
    summary:
      "High-conversion storefront and operations suite for a growing retailer.",
    highlight:
      "Turned a fragmented commerce flow into a polished multi-locale product.",
    impact:
      "Scaled catalog operations across thousands of SKUs while keeping checkout fast.",
    role: "Product design, frontend architecture, checkout experience",
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    tags: ["Next.js", "TypeScript", "Stripe", "PostgreSQL"],
    year: "2024",
  },
  {
    id: "2",
    slug: "analytics-dashboard",
    title: "Analytics dashboard",
    description: "",
    summary:
      "Real-time reporting workspace built for busy growth and marketing teams.",
    highlight: "Made dense reporting feel legible, calm, and decision-ready.",
    impact:
      "Unified live KPIs, export flows, and campaign analysis in a single interface.",
    role: "Design system, charts UX, frontend platform",
    githubUrl: "https://github.com",
    tags: ["React", "Node.js", "PostgreSQL", "Charts"],
    year: "2023",
  },
  {
    id: "3",
    slug: "design-system",
    title: "Design system & docs",
    description: "",
    summary:
      "Internal component library, docs, and token system for multiple product squads.",
    highlight:
      "Reduced visual drift and accelerated delivery through shared primitives.",
    impact:
      "Created consistency across five teams with reusable UI foundations.",
    role: "System architecture, component APIs, documentation",
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    tags: ["React", "Storybook", "Tailwind", "Design tokens"],
    year: "2023",
  },
  {
    id: "4",
    slug: "developer-cli",
    title: "Developer CLI tool",
    description: "",
    summary:
      "Open-source CLI focused on fast scaffolding and deployment workflows.",
    highlight:
      "Wrapped repetitive deployment chores into a scriptable toolchain.",
    impact:
      "Reached broad adoption through plugin support and clear developer ergonomics.",
    role: "CLI UX, TypeScript tooling, release workflow",
    githubUrl: "https://github.com",
    liveUrl: "https://npmjs.com",
    tags: ["TypeScript", "CLI", "npm"],
    year: "2022",
  },
  {
    id: "5",
    slug: "mobile-booking-app",
    title: "Mobile booking app",
    description: "",
    summary: "Mobile-first booking journey for a services marketplace.",
    highlight:
      "Designed an intuitive schedule and payment flow for small screens.",
    impact:
      "Improved booking completion by simplifying selection, payment, and reminders.",
    role: "Mobile UX, booking architecture, API integration",
    githubUrl: "https://github.com",
    tags: ["React Native", "Expo", "Node.js"],
    year: "2022",
  },
  {
    id: "6",
    slug: "hr-portal",
    title: "Internal HR portal",
    description: "",
    summary:
      "Operational portal covering leave, timesheets, and employee workflows.",
    highlight:
      "Brought clarity to complex internal processes with a cleaner interface.",
    impact:
      "Supported a large employee base with role-aware workflows and auditability.",
    role: "Frontend implementation, SSO flows, operational tooling",
    tags: ["React", ".NET", "SSO"],
    year: "2021",
  },
];

export const featuredProjectIds = ["1", "2", "3"];
