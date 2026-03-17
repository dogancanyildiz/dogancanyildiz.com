export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
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
    githubUrl: "https://github.com",
    tags: ["React", "Node.js", "PostgreSQL", "Charts"],
    year: "2023",
  },
  {
    id: "3",
    slug: "design-system",
    title: "Design system & docs",
    description: "",
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
    githubUrl: "https://github.com",
    tags: ["React Native", "Expo", "Node.js"],
    year: "2022",
  },
  {
    id: "6",
    slug: "hr-portal",
    title: "Internal HR portal",
    description: "",
    tags: ["React", ".NET", "SSO"],
    year: "2021",
  },
];

export const featuredProjectIds = ["1", "2", "3"];
