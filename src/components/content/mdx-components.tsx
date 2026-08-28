import type { ComponentType } from "react";
import { ProjectMeta } from "@/components/content/mdx-project-meta";
import { Screenshot } from "@/components/content/mdx-screenshot";

export const mdxComponents: Record<string, ComponentType<Record<string, unknown>>> = {
  ProjectMeta: ProjectMeta as unknown as ComponentType<Record<string, unknown>>,
  Screenshot: Screenshot as unknown as ComponentType<Record<string, unknown>>,
};
