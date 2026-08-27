import type { SimpleIcon } from "simple-icons";
import {
  siBootstrap,
  siClickup,
  siCoolify,
  siCss,
  siDocker,
  siExpress,
  siGit,
  siGithubactions,
  siGo,
  siHtml5,
  siJavascript,
  siLinux,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPhp,
  siPostgresql,
  siQemu,
  siReact,
  siSqlite,
  siTraefikproxy,
  siTypescript,
} from "simple-icons";

/** Brand icon data kept local for CSP-safe inline SVG rendering. */
export type TechIconData = Pick<SimpleIcon, "title" | "path" | "hex">;

/**
 * Maps profile skill labels (and common stack tokens) to Simple Icons entries.
 * Labels without a logo still render as text-only pills.
 */
const SKILL_ICONS: Record<string, TechIconData> = {
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  "Next.js": siNextdotjs,
  React: siReact,
  HTML: siHtml5,
  CSS: siCss,
  Bootstrap: siBootstrap,
  "Node.js / Express.js": siNodedotjs,
  "Node.js": siNodedotjs,
  Express: siExpress,
  "Express.js": siExpress,
  PHP: siPhp,
  MySQL: siMysql,
  PostgreSQL: siPostgresql,
  MongoDB: siMongodb,
  SQLite: siSqlite,
  Git: siGit,
  "GitHub Actions": siGithubactions,
  Docker: siDocker,
  Traefik: siTraefikproxy,
  Coolify: siCoolify,
  "Linux server engineering": siLinux,
  "Linux sunucu yönetimi": siLinux,
  "CI/CD hatları": siGithubactions,
  Linux: siLinux,
  QEMU: siQemu,
  Go: siGo,
  ClickUp: siClickup,
};

export function skillIconFor(label: string): TechIconData | null {
  return SKILL_ICONS[label] ?? null;
}
